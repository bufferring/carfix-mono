import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';

// Components
function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">CarFix</Link>
          <ul className="flex space-x-6">
            <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link to="/products" className="hover:text-gray-300">Products</Link></li>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <li><Link to="/users" className="hover:text-gray-300">Users</Link></li>
                )}
                <li><Link to="/orders" className="hover:text-gray-300">Orders</Link></li>
                <li><Link to="/cart" className="hover:text-gray-300">Cart</Link></li>
                <li><Link to="/wishlist" className="hover:text-gray-300">Wishlist</Link></li>
                <li>
                  <button
                    onClick={logout}
                    className="hover:text-gray-300"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
                <li><Link to="/register" className="hover:text-gray-300">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-4">
      <div className="card">
        <h1 className="text-3xl font-bold mb-4">Welcome to CarFix</h1>
        <p className="text-gray-600">
          {user ? (
            `Welcome back, ${user.name}!`
          ) : (
            'Your one-stop solution for automotive parts and services.'
          )}
        </p>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="card">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                {user.role}
              </span>
              {user.is_verified && (
                <span className="inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
                  Verified
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="card hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">Category: {product.category}</p>
            <p className="text-gray-600">Brand: {product.brand}</p>
            <p className="text-gray-600">Seller: {product.seller}</p>
            <p className="text-lg font-bold mt-2">${product.price}</p>
            {user && (
              <div className="mt-4 flex space-x-2">
                <button 
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  onClick={() => {/* TODO: Add to cart functionality */}}
                >
                  Add to Cart
                </button>
                <button 
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  onClick={() => {/* TODO: Add to wishlist functionality */}}
                >
                  Wishlist
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                <p className="text-gray-600">Customer: {order.customer}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${order.total_amount}</p>
                <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                  order.status === 'delivered' ? 'bg-green-200 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-200 text-blue-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                order.payment_status === 'paid' ? 'bg-green-200 text-green-700' :
                'bg-yellow-200 text-yellow-700'
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Nav />
          <main className="py-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/products" element={<Products />} />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireRole="admin">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 