const mongoose = require('mongoose');
const Branch = require('../../../models/Branch');

async function createBranch({ companyId, payload }) {
  return Branch.create({
    ...payload,
    companyId: new mongoose.Types.ObjectId(companyId),
  });
}

async function findBranches(query) {
  return Branch.find(query).sort({ isHeadOffice: -1, name: 1 });
}

async function updateBranch({ companyId, branchId, payload }) {
  return Branch.findOneAndUpdate(
    { _id: branchId, companyId: new mongoose.Types.ObjectId(companyId) },
    { $set: payload },
    { new: true, runValidators: true }
  );
}

async function softDeleteBranch({ companyId, branchId }) {
  return Branch.findOneAndUpdate(
    {
      _id: branchId,
      companyId: new mongoose.Types.ObjectId(companyId),
    },
    {
      $set: {
        isActive: false,
        deletedAt: new Date(),
      },
    },
    { new: true }
  );
}

module.exports = {
  createBranch,
  findBranches,
  updateBranch,
  softDeleteBranch,
};
