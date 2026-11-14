import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

// Add Product : /api/product/add
export const addProduct = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.json({ success: false, message: "Cloudinary is not configured" });
    }

    const images = (req.files || []).filter((file) => file?.buffer);

    if (!images.length) {
      return res.json({ success: false, message: "Please upload at least one image" });
    }

    const productData = JSON.parse(req.body.productData);
    productData.price = Number(productData.price);
    productData.offerPrice = Number(productData.offerPrice);
    productData.description = Array.isArray(productData.description)
      ? productData.description
      : String(productData.description || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

    if (!productData.name || !productData.category) {
      return res.json({ success: false, message: "Name and category are required" });
    }

    if (!productData.price || !productData.offerPrice) {
      return res.json({ success: false, message: "Price and offer price are required" });
    }

    const imagesUrl = await Promise.all(images.map((item) => uploadBuffer(item).then((result) => result.secure_url)));

    await Product.create({ ...productData, image: imagesUrl });

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Product : /api/product/list
export const productList = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get single Product : /api/product/id
export const productById = async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    const product = await Product.findById(id);
    res.json({ success: true, product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Product inStock : /api/product/stock
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    await Product.findByIdAndUpdate(id, { inStock });
    res.json({ success: true, message: "Stock Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
