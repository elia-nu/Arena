export const buildUsernameBase = ({ email, phone, firstName, lastName }) => {
  if (email) {
    const local = email.split("@")[0];
    const cleaned = local.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (cleaned.length >= 3) return cleaned.slice(0, 24);
  }

  if (firstName && lastName) {
    const combined = `${firstName}${lastName}`
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    if (combined.length >= 3) return combined.slice(0, 24);
  }

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 3) return `user${digits.slice(-10)}`;
  }

  return "user";
};

export const generateUniqueUsername = async (User, fields) => {
  const base = buildUsernameBase(fields);
  let username = (base.length >= 3 ? base : `${base}usr`).slice(0, 30);

  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    const suffixStr = String(suffix);
    username = `${base.slice(0, 30 - suffixStr.length)}${suffixStr}`;
  }

  return username;
};
