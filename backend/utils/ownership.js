const getOwnerScope = (userId) => ({
  $or: [{ owner: userId }, { owner: { $exists: false } }]
});

const applyOwnerScope = (filter = {}, userId) => {
  const ownerScope = getOwnerScope(userId);
  if (!filter || !Object.keys(filter).length) return ownerScope;
  return { $and: [filter, ownerScope] };
};

const claimOwnership = (doc, userId) => {
  if (doc && !doc.owner) {
    doc.owner = userId;
  }
  return doc;
};

module.exports = { getOwnerScope, applyOwnerScope, claimOwnership };
