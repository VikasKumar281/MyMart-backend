import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Stripe from "stripe";

const buildOrder = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Invalid data" };
  }

  const pricedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.product || !quantity || quantity < 1) {
      return { error: "Invalid cart item" };
    }

    const product = await Product.findById(item.product);
    if (!product) return { error: "Product not found" };
    if (!product.inStock) return { error: `${product.name} is out of stock` };

    const lineTotal = Number(product.offerPrice) * quantity;
    subtotal += lineTotal;
    pricedItems.push({
      product: product._id,
      name: product.name,
      offerPrice: Number(product.offerPrice),
      quantity,
    });
  }

  const tax = Math.round(subtotal * 0.02 * 100) / 100;
  const amount = Math.round((subtotal + tax) * 100) / 100;

  return { pricedItems, amount, tax };
};

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    if (!address) {
      return res.json({ success: false, message: "Please select an address" });
    }

    const built = await buildOrder(items);
    if (built.error) return res.json({ success: false, message: built.error });

    await Order.create({
      userId,
      items: built.pricedItems.map(({ product, quantity }) => ({ product, quantity })),
      amount: built.amount,
      address,
      paymentType: "COD",
      isPaid: false,
    });

    await User.findByIdAndUpdate(userId, { cartItems: {} });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

const stripeKey = () => (process.env.STRIPE_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");

const listUserOrders = (userId) =>
  Order.find({
    userId: String(userId),
    $or: [{ paymentType: "COD" }, { isPaid: true }],
  })
    .populate("items.product address")
    .sort({ createdAt: -1 });

// Online payment stays in test mode. A live secret key is rejected so a real card is never charged.
export const paymentMode = async (req, res) => {
  const key = stripeKey();
  if (key.startsWith("sk_live_")) {
    return res.json({
      success: true,
      mode: "disabled",
      message: "Live Stripe keys are blocked. Use a free test key that starts with sk_test_, or leave the key empty.",
    });
  }
  if (key.startsWith("sk_test_")) {
    return res.json({ success: true, mode: "stripe" });
  }
  return res.json({ success: true, mode: "demo" });
};

const isValidTestCard = ({ cardNumber, expiry, cvc }) => {
  const card = String(cardNumber || "").replace(/\s/g, "");
  if (card !== "4242424242424242") {
    return "Test card declined. Use 4242 4242 4242 4242. No real money is charged.";
  }
  const match = String(expiry || "").trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) return "Enter expiry as MM/YY";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  if (month < 1 || month > 12 || expired) return "Enter a future expiry date";
  if (!/^\d{3}$/.test(String(cvc || "").trim())) return "Enter a 3 digit CVC, for example 123";
  return "";
};

// Built-in Stripe test checkout. Used when no Stripe key is set, so nothing is charged.
export const placeOrderTest = async (req, res) => {
  try {
    const key = stripeKey();
    if (key.startsWith("sk_live_")) {
      return res.json({ success: false, message: "Live payments are disabled." });
    }
    if (key.startsWith("sk_test_")) {
      return res.json({ success: false, message: "Stripe test checkout is enabled. Continue to Stripe." });
    }

    const { userId, items, address, cardNumber, expiry, cvc } = req.body;
    if (!address) return res.json({ success: false, message: "Please select an address" });

    const cardError = isValidTestCard({ cardNumber, expiry, cvc });
    if (cardError) return res.json({ success: false, message: cardError });

    const built = await buildOrder(items);
    if (built.error) return res.json({ success: false, message: built.error });

    await Order.create({
      userId,
      items: built.pricedItems.map(({ product, quantity }) => ({ product, quantity })),
      amount: built.amount,
      address,
      paymentType: "Online",
      isPaid: true,
    });

    await User.findByIdAndUpdate(userId, { cartItems: {} });
    return res.json({ success: true, message: "Test payment successful. No money was charged." });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const key = stripeKey();
    if (!key.startsWith("sk_test_")) {
      return res.json({
        success: false,
        message: key.startsWith("sk_live_")
          ? "Live Stripe keys are blocked, so a real card cannot be charged."
          : "Stripe test key is not set. Use the in-app test card instead.",
      });
    }

    const { userId, items, address } = req.body;
    if (!address) {
      return res.json({ success: false, message: "Please select an address" });
    }

    const built = await buildOrder(items);
    if (built.error) return res.json({ success: false, message: built.error });

    const origin = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const currency = (process.env.STRIPE_CURRENCY || "inr").toLowerCase();
    const stripe = new Stripe(key);

    const order = await Order.create({
      userId,
      items: built.pricedItems.map(({ product, quantity }) => ({ product, quantity })),
      amount: built.amount,
      address,
      paymentType: "Online",
      isPaid: false,
    });

    try {
      const line_items = built.pricedItems.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.name },
          unit_amount: Math.round(item.offerPrice * 100),
        },
        quantity: item.quantity,
      }));

      if (built.tax > 0) {
        line_items.push({
          price_data: {
            currency,
            product_data: { name: "Tax (2%)" },
            unit_amount: Math.round(built.tax * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        success_url: `${origin}/my-orders?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderId: order._id.toString(),
          userId: String(userId),
        },
      });

      return res.json({ success: true, url: session.url });
    } catch (error) {
      await Order.findByIdAndDelete(order._id);
      return res.json({ success: false, message: error.message });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Verify Stripe payment : /api/order/verify-stripe
export const verifyStripe = async (req, res) => {
  try {
    const key = stripeKey();
    if (!key.startsWith("sk_test_")) {
      return res.json({ success: false, message: "Stripe test mode is not enabled" });
    }

    const { sessionId } = req.body;
    const userId = req.userId || req.body.userId;
    if (!sessionId) {
      return res.json({ success: false, message: "Missing payment session" });
    }

    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const order = await Order.findById(session.metadata?.orderId);

    if (!order || String(order.userId) !== String(userId)) {
      return res.json({ success: false, message: "Not Authorized" });
    }

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    order.isPaid = true;
    await order.save();
    await User.findByIdAndUpdate(userId, { cartItems: {} });
    const orders = await listUserOrders(userId);

    return res.json({ success: true, message: "Payment successful", orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await listUserOrders(req.userId || req.body.userId);
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get All Orders ( for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    let orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    if (req.seller?.role !== "admin") {
      orders = orders.filter((order) =>
        order.items.some((item) => item.product && String(item.product.sellerId || "") === String(req.seller.id))
      );
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
