// Only explore images remain — used in Search page grid
// All other data (users, posts, notifications) comes from real API
export const exploreImages = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  image: `https://picsum.photos/seed/explore${i + 1}/300/300`,
  likes: Math.floor(Math.random() * 2000) + 100,
  comments: Math.floor(Math.random() * 200) + 10,
}));
