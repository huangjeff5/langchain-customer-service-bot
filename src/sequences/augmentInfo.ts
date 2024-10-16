import { getCustomerByEmail, getOrderById, getProductById, getRecentOrdersByEmail, listProducts } from '../firestoreDb';
import { extractInfo } from './extractInfo';

export const augmentInfo = async (intent: string, customerInquiry: string, email: string) => {
  let responseData = {};
  switch (intent) {
    case 'Catalog':
      const products = await listProducts();
      responseData = { catalog: products };
      break;
    case 'Product':
      const productInfo = await extractInfo.invoke({ inquiry: customerInquiry });
      if (!!productInfo.productId && productInfo.productId !== "") {
        const product = await getProductById(productInfo.productId);
        responseData = { product };
      } else {
        const products = await listProducts();
        responseData = { products };
      }
      break;
    case 'Order':
      const orderInfo = await extractInfo.invoke({ inquiry: customerInquiry });
      console.log('Extracted order info:', orderInfo);
      if (!!orderInfo.orderId && orderInfo.orderId !== "") {
        const order = await getOrderById(orderInfo.orderId);
        console.log('Retrieved order:', order);
        responseData = { order };
      } else {
        const recentOrders = await getRecentOrdersByEmail(email);
        responseData = { recentOrders };
      }
      break;
    case 'Other':
      const customer = await getCustomerByEmail(email);
      responseData = { customer };
      break;
  }
  return { responseData };
};
