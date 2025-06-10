import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Components
function Nav() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">CarFix</Link>
          <ul className="flex space-x-6">
            <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link to="/users" className="hover:text-gray-300">Users</Link></li>
            <li><Link to="/products" className="hover:text-gray-300">Products</Link></li>
            <li><Link to="/orders" className="hover:text-gray-300">Orders</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="card">
        <h1 className="text-3xl font-bold mb-4">Welcome to CarFix</h1>
        <p className="text-gray-600">Your one-stop solution for automotive parts and services.</p>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
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

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="card">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">Category: {product.category}</p>
            <p className="text-gray-600">Brand: {product.brand}</p>
            <p className="text-gray-600">Seller: {product.seller}</p>
            <p className="text-lg font-bold mt-2">${product.price}</p>
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

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="card">
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
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 