import { filterProductsService } from "../services";

export const getProductsSocket = async (socket, user) => {
  socket.on("getProducts", async (data) => {
    // console.log(data);
    const userId = user && user.id;
    try {
      const products = await filterProductsService(data, userId);
      socket.emit("getProducts", products);
    } catch (error) {
      console.error(error);
      socket.emit("error", error);
    }
  });
};