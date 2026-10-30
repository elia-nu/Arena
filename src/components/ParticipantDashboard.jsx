import { motion } from "framer-motion";
import { useState } from "react";
import {
  IoCalendar,
  IoLocation,
  IoPeople,
  IoCheckmarkCircle,
  IoTime,
} from "react-icons/io5";

const ParticipantDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("events");

  const registeredEvents = [
    {
      id: 1,
      title: "Championship Tournament 2025",
      date: "2025-03-15",
      location: "Main Arena",
      status: "registered",
      paymentStatus: "paid",
      teamName: "Thunder Squad",
      role: "Team Leader",
    },
    {
      id: 2,
      title: "Weekly League Match",
      date: "2025-02-20",
      location: "Training Ground",
      status: "registered",
      paymentStatus: "pending",
      teamName: null,
      role: "Individual",
    },
  ];

  const tabs = [
    { id: "events", label: "My Events" },
    { id: "payments", label: "Payments" },
    { id: "team", label: "Team Management" },
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-black text-secondary-600 mb-6">
            Participant{" "}
            <span className="bg-gradient-to-r from-tertiary-600 via-tertiary-500 to-tertiary-600 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-xl text-primary-700 max-w-3xl mx-auto">
            Track your events, payments, and team information
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-tertiary-500 to-tertiary-400 text-primary-950 shadow-lg"
                  : "bg-secondary-50 border-2 border-primary-200 text-primary-700 hover:border-tertiary-500"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === "events" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {registeredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="bg-white border-2 border-primary-200 rounded-3xl p-6 hover:border-tertiary-500 transition-all shadow-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-secondary-600">
                      {event.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        event.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-tertiary-100 text-tertiary-700"
                      }`}
                    >
                      {event.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-primary-700">
                      <IoCalendar className="text-tertiary-500" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-700">
                      <IoLocation className="text-tertiary-500" />
                      <span>{event.location}</span>
                    </div>
                    {event.teamName && (
                      <div className="flex items-center gap-2 text-primary-700">
                        <IoPeople className="text-tertiary-500" />
                        <span>
                          {event.teamName} - {event.role}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <motion.button
                      className="flex-1 px-4 py-2 bg-secondary-500 text-white font-bold rounded-lg hover:bg-secondary-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Details
                    </motion.button>
                    {event.paymentStatus === "pending" && (
                      <motion.button
                        className="flex-1 px-4 py-2 bg-secondary-500 text-white font-bold rounded-lg hover:bg-secondary-600"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Pay Now
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white border-2 border-primary-200 rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-secondary-600 mb-6">
                Payment History
              </h2>
              <div className="space-y-4">
                {registeredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border-2 border-primary-200 rounded-xl"
                  >
                    <div>
                      <h3 className="font-bold text-secondary-600">
                        {event.title}
                      </h3>
                      <p className="text-primary-600 text-sm">{event.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-950">$50.00</p>
                      <span
                        className={`text-sm ${
                          event.paymentStatus === "paid"
                            ? "text-green-600"
                            : "text-tertiary-600"
                        }`}
                      >
                        {event.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="bg-white border-2 border-primary-200 rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-secondary-600 mb-6">
                Team Management
              </h2>
              <div className="space-y-6">
                {registeredEvents
                  .filter((e) => e.teamName)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="border-2 border-primary-200 rounded-xl p-6"
                    >
                      <h3 className="text-2xl font-bold text-secondary-600 mb-4">
                        {event.teamName}
                      </h3>
                      <p className="text-primary-600 mb-4">
                        Your Role: {event.role}
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-secondary-600">
                          Team Members:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "John Doe",
                            "Jane Smith",
                            "Mike Johnson",
                            "Sarah Williams",
                          ].map((member, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-white rounded-lg"
                            >
                              <IoCheckmarkCircle className="text-green-500" />
                              <span>{member}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
