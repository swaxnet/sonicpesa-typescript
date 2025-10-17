import React, { useState } from "react";
import axios from "axios";

interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    transaction_id: string;
    order_id: string;
    amount: number;
    fee: number;
    net_amount: number;
    status: string;
  };
}

const App: React.FC = () => {
  const [form, setForm] = useState({
    phone: "",
    amount: "",
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createPayment = async () => {
    setLoading(true);
    setStatus("Tunasindika ombi la malipo...");
    try {
      const res = await axios.post<PaymentResponse>(
        "https://sonicpesa.com/api/payment/create",
        {
          phone: form.phone,
          amount: Number(form.amount),
          name: form.name,
          email: form.email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_API_KEY", // 🔑 badilisha API key yako hapa
          },
        }
      );

      if (res.data.success && res.data.data) {
        const order_id = res.data.data.order_id;
        setOrderId(order_id);
        setStatus("Malipo yameanzishwa. Tafadhali thibitisha kwenye simu yako...");
        pollPaymentStatus(order_id);
      } else {
        setStatus("Imeshindikana kuanzisha malipo.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Kuna tatizo kwenye maombi ya malipo.");
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (order_id: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.post(
          "https://sonicpesa.com/api/payment/status",
          { order_id },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer YOUR_API_KEY",
            },
          }
        );

        const paymentStatus = res.data?.data?.status;
        console.log("Status:", paymentStatus);

        if (paymentStatus === "completed") {
          clearInterval(interval);
          setStatus("Malipo yamekamilika! Unapelekwa kwenye videox.com...");
          window.location.href = "https://videox.com";
        } else if (attempts >= 10) {
          clearInterval(interval);
          setStatus("Imeshindikana kuthibitisha malipo. Tafadhali jaribu tena.");
        } else {
          setStatus(`Status ya sasa: ${paymentStatus}`);
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setStatus("Hitilafu wakati wa kuthibitisha status ya malipo.");
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-green-400">
          SonicPesa Payment
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Jina kamili"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="email"
          name="email"
          placeholder="Barua pepe"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Namba ya simu (mf. 2557...)"
          value={form.phone}
          onChange={handleChange}
          className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="number"
          name="amount"
          placeholder="Kiasi (Tsh)"
          value={form.amount}
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
        />

        <button
          onClick={createPayment}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded disabled:bg-gray-500"
        >
          {loading ? "Inatuma..." : "Lipa Sasa"}
        </button>

        {status && (
          <p className="mt-4 text-sm text-center text-blue-300">{status}</p>
        )}
      </div>
    </div>
  );
};

export default App;