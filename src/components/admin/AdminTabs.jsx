const AdminTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "coupons", label: "Coupons" },
    { id: "media", label: "Media" },
    { id: "reports", label: "Reports" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="flex gap-4 border-b-2 border-primary-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === tab.id
              ? "border-b-4 border-tertiary-500 text-primary-950"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default AdminTabs;
