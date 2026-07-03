export const canPostBusiness = (role) => {
  return role === "premium" || role === "entreprise" || role === "monetise";
};

export const canBeMonetized = (role) => {
  return role === "monetise";
};