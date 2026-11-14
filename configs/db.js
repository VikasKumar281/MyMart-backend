import mongoose from "mongoose";

let connecting;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, { dbName: "MyMart" })
      .then(() => {
        console.log("Database Connected");
      })
      .catch((error) => {
        connecting = null;
        throw error;
      });
  }

  return connecting;
};

export default connectDB;
