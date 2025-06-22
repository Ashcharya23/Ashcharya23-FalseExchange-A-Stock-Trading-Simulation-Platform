import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [form, setForm] = useState({ security: "", quantity: "" });
  const [selectedOrderId, setSelectedOrderId] = useState(null);


  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  const handleAmend = async (order) => {
    const newQty = prompt(`Edit quantity for ${order.security}:`, order.quantity);
    if (newQty && !isNaN(newQty)) {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        await axios.patch(`http://localhost:5000/api/orders/amend/${order._id}`, { quantity: Number(newQty) }, { headers });
        fetchData();
      } catch {
        alert("Failed to amend order");
      }
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`http://localhost:5000/api/orders/cancel/${orderId}`, {}, { headers });
      fetchData();
    } catch {
      alert("Failed to cancel order");
    }
  };


  // Fetch orders and portfolio
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const [orderRes, portfolioRes] = await Promise.all([
      axios.get("http://localhost:5000/api/orders/my-orders", { headers }),
      axios.get("http://localhost:5000/api/portfolio", { headers }),
    ]);
    setOrders(orderRes.data.orders);
    setPortfolio(portfolioRes.data.portfolio);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Place order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.post("http://localhost:5000/api/orders/place", form, { headers });
      setForm({ security: "", quantity: "" });
      fetchData();
    } catch {
      alert("Failed to place order");
    }
  };

  

  return (
    <div className="p-6 w-screen h-screen justify-center items-center">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* Order Form */}
      <form onSubmit={handlePlaceOrder} className="flex gap-4 mb-6">
        <input
          name="security"
          value={form.security}
          onChange={(e) => setForm({ ...form, security: e.target.value })}
          placeholder="Security Name (e.g. TCS)"
          className="border p-2 flex-1"
          required
        />
        <input
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder="Quantity"
          className="border p-2 w-32"
          required
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Place Order
        </button>
      </form>

      {/* Orders Table */}
      <h2 className="text-xl font-semibold mb-2">My Orders</h2>
      <div className="overflow-x-auto mb-6">
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr className="">
              <th className="p-2 border">Security</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Executed</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="p-2 border">{order.security}</td>
                <td className="p-2 border">{order.quantity}</td>
                <td className="p-2 border">{order.status}</td>
                <td className="p-2 border">{order.executedQty}</td>
                <td className="p-2 border">
                  {/* Amend/Cancel buttons will be added after backend */}
                  {order.status !== "executed" && (
                    <>
                      <button onClick={() => handleAmend(order)} className="text-blue-500 mr-2">Amend</button>
                      <button onClick={() => handleCancel(order._id)} className="text-red-500">Cancel</button>
                      <button  className="text-green-500"  onClick={async () => {
                        const confirmed = window.confirm("Are you sure you want to request the server to execute this order?");
                        if (!confirmed) return;

                        try {
                          const token = localStorage.getItem("token");
                          const headers = { Authorization: `Bearer ${token}` };

                          await axios.patch(`http://localhost:5000/api/orders/execute/${order._id}`, {}, { headers });

                          // After server finishes execution, fetch updated data
                          fetchData();
                        } catch (err) {
                          alert("Failed to request execution");
                        }
                      }}>
                        Request Server
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portfolio Table */}
      <h2 className="text-xl font-semibold mb-2">My Portfolio</h2>
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr className="">
              <th className="p-2 border">Security</th>
              <th className="p-2 border">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item) => (
              <tr key={item.security}>
                <td className="p-2 border">{item.security}</td>
                <td className="p-2 border">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
