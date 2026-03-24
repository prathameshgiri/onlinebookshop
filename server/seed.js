const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const books = [
  {
    id: uuidv4(), title: "The Great Gatsby", author: "F. Scott Fitzgerald",
    price: 299, originalPrice: 499, category: "Fiction", rating: 4.5, reviews: 2847, stock: 50,
    description: "A story of decadence, idealism, and the American Dream set in the Jazz Age.",
    coverColor: "#1a1a2e", coverAccent: "#e94560",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    badge: "Bestseller", featured: true, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "To Kill a Mockingbird", author: "Harper Lee",
    price: 349, originalPrice: 599, category: "Fiction", rating: 4.8, reviews: 5921, stock: 35,
    description: "A Pulitzer Prize-winning masterwork of honor and injustice in the deep South.",
    coverColor: "#0f3460", coverAccent: "#e2b04a",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780061935466-L.jpg",
    badge: "Award Winner", featured: true, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "1984", author: "George Orwell",
    price: 249, originalPrice: 399, category: "Dystopian", rating: 4.7, reviews: 8103, stock: 60,
    description: "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
    coverColor: "#16213e", coverAccent: "#c84b31",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    badge: "Classic", featured: true, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Atomic Habits", author: "James Clear",
    price: 499, originalPrice: 799, category: "Self-Help", rating: 4.9, reviews: 12450, stock: 80,
    description: "An easy and proven way to build good habits and break bad ones.",
    coverColor: "#1b4332", coverAccent: "#f4d03f",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    badge: "#1 Bestseller", featured: true, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Sapiens", author: "Yuval Noah Harari",
    price: 449, originalPrice: 699, category: "History", rating: 4.6, reviews: 9234, stock: 45,
    description: "A brief history of humankind from the Stone Age to the Silicon Age.",
    coverColor: "#2d1b69", coverAccent: "#f39c12",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
    badge: "Trending", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "The Psychology of Money", author: "Morgan Housel",
    price: 399, originalPrice: 599, category: "Finance", rating: 4.7, reviews: 7856, stock: 55,
    description: "Timeless lessons on wealth, greed, and happiness.",
    coverColor: "#1a3a4a", coverAccent: "#27ae60",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
    badge: "New", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Dune", author: "Frank Herbert",
    price: 549, originalPrice: 899, category: "Sci-Fi", rating: 4.8, reviews: 6721, stock: 30,
    description: "Set in the distant future amidst a feudal interstellar society.",
    coverColor: "#3d2b1f", coverAccent: "#e67e22",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
    badge: "Epic", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "The Midnight Library", author: "Matt Haig",
    price: 329, originalPrice: 499, category: "Fiction", rating: 4.4, reviews: 4523, stock: 40,
    description: "Between life and death there is a library where every book is a life you could have lived.",
    coverColor: "#0d2137", coverAccent: "#3498db",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    badge: "Staff Pick", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Thinking, Fast and Slow", author: "Daniel Kahneman",
    price: 459, originalPrice: 699, category: "Psychology", rating: 4.6, reviews: 8902, stock: 25,
    description: "A groundbreaking tour of the mind by Nobel laureate Daniel Kahneman.",
    coverColor: "#1c1c1c", coverAccent: "#e74c3c",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
    badge: "Nobel Winner", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "The Alchemist", author: "Paulo Coelho",
    price: 199, originalPrice: 349, category: "Fiction", rating: 4.5, reviews: 11203, stock: 70,
    description: "A magical story about following your dreams across the Egyptian desert.",
    coverColor: "#2c1810", coverAccent: "#f1c40f",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
    badge: "All Time Classic", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki",
    price: 279, originalPrice: 449, category: "Finance", rating: 4.3, reviews: 14500, stock: 90,
    description: "What the rich teach their kids about money — the #1 personal finance book.",
    coverColor: "#7d1d1d", coverAccent: "#f39c12",
    coverImage: "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg",
    badge: "Iconic", featured: false, createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), title: "Brave New World", author: "Aldous Huxley",
    price: 229, originalPrice: 399, category: "Dystopian", rating: 4.4, reviews: 5603, stock: 45,
    description: "A dystopian novel set in a futuristic World State of genetically modified citizens.",
    coverColor: "#0a2240", coverAccent: "#9b59b6",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
    badge: "Classic", featured: false, createdAt: new Date().toISOString()
  }
];

// Seed books
db.set('books', books).write();

// Seed admin
if (!db.get('admins').find({ username: 'admin' }).value()) {
  db.get('admins').push({
    id: uuidv4(),
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    createdAt: new Date().toISOString()
  }).write();
}

// Clear orders & messages — only real user activity shows
db.set('orders', []).write();
db.set('messages', []).write();

console.log('✅ Database seeded successfully!');
console.log(`📚 ${books.length} books added (INR prices & cover images)`);
console.log('📦 Orders & messages cleared — only real user activity will appear');
console.log('👤 Admin: username=admin, password=admin123');
