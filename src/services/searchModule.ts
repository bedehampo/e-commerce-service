const { MongoClient } = require("mongodb");

// export const connectDBMongoDriver = async () => {
//     const uri = process.env.MONGO_URI;

//   const client = new MongoClient(uri);
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");
//   } catch (err) {
//     console.error(err);
//   } finally {
//     await client.close();
//   }
// }

const uri = process.env.MONGO_URI;

export const searchProduct = async (query: string) => {
  const agg = [
    {
      $search: {
        index: "autocompleteProducts",
        compound: {
          should: [
            {
              autocomplete: {
                query: query,
                path: "productName",
                fuzzy: {
                  maxEdits: 2,
                  maxExpansions: 10,
                },
              },
            },
            {
              autocomplete: {
                query: query,
                path: "productDescription",
                fuzzy: {
                  maxEdits: 2,
                  maxExpansions: 10,
                },
              },
            },
            {
              autocomplete: {
                query: query,
                path: "productCategory.title",
                fuzzy: {
                  maxEdits: 2,
                  maxExpansions: 10,
                },
              },
            },
          ],
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        productName: 1,
      },
    },
  ];

  const client = await MongoClient.connect(uri, {});
  const coll = client.db("staging-db").collection("products");
  const cursor = coll.aggregate(agg);
  const result = await cursor.toArray();
  await client.close();
  //   return query;
  return result;
};
