export const getAgeCategoryFromDob = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age < 18 ? "Y" : "A";
};

export const generateMemberCode = async (User, dob) => {
  const ageCategory = getAgeCategoryFromDob(dob);

  const existingCodes = await User.find({
    memberCode: { $regex: /^[YA]\d{3}$/ },
  })
    .select("memberCode")
    .lean();

  let maxSequence = 0;
  for (const user of existingCodes) {
    const sequence = Number.parseInt(user.memberCode?.slice(1), 10);
    if (!Number.isNaN(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const nextSequence = maxSequence + 1;
  return `${ageCategory}${String(nextSequence).padStart(3, "0")}`;
};
