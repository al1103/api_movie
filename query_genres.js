/**
 * Quick Query Helper
 * Copy-paste this in MongoDB shell to check genres structure
 */

// Check specific genre you sent
db.genres.findOne({ _id: ObjectId("690f1bd732aa6ef77bac2bc3") });

// Show all genres with their fields
db.genres.find().limit(3).pretty();

// Count genres
db.genres.countDocuments();

// Show sample genres with all fields
db.genres.aggregate([
  { $limit: 3 },
  {
    $project: {
      _id: 1,
      name: 1,
      slug: 1,
      type: 1,
      other_fields: { $objectToArray: "$$ROOT" },
    },
  },
]);
