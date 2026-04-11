export const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};
