import { UserService } from "../../lib/userService";
import { Shop } from "../../model/shop/shop";

const getUsersVisitsStats = async (
  userService: UserService,
  searchParam: string
): Promise<{
  totalVisitAllShops: number;
  totalUsers: number;
  returnVisitsAllShops: number;
  newVisitsAllShops: number;
}> => {
  const shops = await Shop.find();
  const users = await userService.getAllUsers();
  const totalUsers = users.length;
  let totalVisitsAllShops = 0;
  let totalReturningVisitsAllShops = 0;
  let totalNewVisitsAllShops = 0;
  let no = 0;
  // get shop personal info
  const getUserDetails = async (userId) => {
    const user = await userService.getUserById(userId);
    if (user) {
      return {
        avatar: user.profilePhotoUrl,
        name: user.firstName + " " + user.lastName,
        email: user.email,
      };
    }
    return {};
  };
  // getting shop user visits info
  const visitInfo = shops.map(async (shop) => {
    const shopOwnerInfo = await getUserDetails(shop.user);
    let totalVisitsShop = 0;
    let totalReturningVisitsShop = 0;
    let totalNewVisitsShop = 0;
    no++;
    if (shop.shopVisitCount && shop.shopVisitCount.visits) {
      totalReturningVisitsAllShops += shop.shopVisitCount.visits.reduce(
        (sum, visit) => sum + visit.count,
        0
      );
      totalReturningVisitsShop = shop.shopVisitCount.visits.reduce(
        (sum, visit) => sum + visit.count,
        0
      );
    }
    if (shop.shopVisitCount && shop.shopVisitCount.newVisit) {
      totalNewVisitsAllShops += shop.shopVisitCount.newVisit.reduce(
        (sum, visit) => sum + visit.count,
        0
      );
      totalNewVisitsShop = shop.shopVisitCount.newVisit.reduce(
        (sum, visit) => sum + visit.count,
        0
      );
    }
    totalVisitsShop = totalReturningVisitsShop + totalNewVisitsShop;
    totalVisitsAllShops += totalVisitsShop;
    return {
      no,
      shopId: shop._id,
      shopOwner: shopOwnerInfo,
      brand_logo: shop.logoImageUrl,
      shopName: shop.brand_name,
      email: shop.official_email,
      contact: shop.official_phone_number,
      followers: shop.followers.length,
      totalVisit: totalVisitsShop,
      returnVisits: totalReturningVisitsShop,
      newVisits: totalNewVisitsShop,
      status: shop.status,
      visitPercentage: 0,
    };
  });
  let visitData = await Promise.all(visitInfo);
  if (searchParam) {
    visitData = visitData.filter((visit) =>
      JSON.stringify(visit)
        .toLowerCase()
        .includes(searchParam.toString().toLowerCase())
    );
  }
  // getting visit by percentage
  visitData.sort((a, b) => b.totalVisit - a.totalVisit);
  visitData.forEach((shop) => {
    shop.visitPercentage = (shop.totalVisit / totalVisitsAllShops) * 100;
  });
  const topFiveShops = visitData.slice(0, 5);
  const topFiveShopsData = topFiveShops.map((shop) => ({
    shopName: shop.shopName,
    brandLogo: shop.brand_logo,
    visitPercentage: shop.visitPercentage,
  }));

  const result = {
    totalVisitAllShops: totalVisitsAllShops,
    totalUsers: totalUsers,
    returnVisitsAllShops: totalReturningVisitsAllShops,
    newVisitsAllShops: totalNewVisitsAllShops,
    MostVisitShop: topFiveShopsData,
    visitData: visitData,
  };
  return result;
};

export default getUsersVisitsStats;
