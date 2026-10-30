import { motion } from "framer-motion";
import { useState } from "react";
import { IoAdd, IoTrash, IoMail, IoPerson, IoCall } from "react-icons/io5";

const RosterManagement = ({
  teamMembers = [],
  onAddMember,
  onRemoveMember,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    username: "",
    phone: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const handleAdd = () => {
    if (newMember.username && newMember.phone) {
      onAddMember?.(newMember);
      setNewMember({
        username: "",
        phone: "",
        email: "",
        firstName: "",
        lastName: "",
      });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-secondary-600">Team Roster</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
        >
          <IoAdd />
          Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border-2 border-primary-200 rounded-xl p-4"
        >
          <h4 className="font-semibold text-secondary-600 mb-4">
            Add New Member
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={newMember.firstName}
              onChange={(e) =>
                setNewMember({ ...newMember, firstName: e.target.value })
              }
              className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newMember.lastName}
              onChange={(e) =>
                setNewMember({ ...newMember, lastName: e.target.value })
              }
              className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
            <input
              type="text"
              placeholder="Username *"
              value={newMember.username}
              onChange={(e) =>
                setNewMember({ ...newMember, username: e.target.value })
              }
              className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              required
            />
            <input
              type="tel"
              placeholder="Phone * (with country code, e.g. +1…)"
              value={newMember.phone}
              onChange={(e) =>
                setNewMember({ ...newMember, phone: e.target.value })
              }
              className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newMember.email}
              onChange={(e) =>
                setNewMember({ ...newMember, email: e.target.value })
              }
              className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Add Member
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewMember({
                  username: "",
                  phone: "",
                  email: "",
                  firstName: "",
                  lastName: "",
                });
              }}
              className="px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {teamMembers.length > 0 ? (
          teamMembers.map((member, index) => (
            <motion.div
              key={member._id || member.id || index}
              className="bg-white border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-tertiary-100 rounded-lg">
                    <IoPerson className="text-tertiary-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary-950">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.name || member.username}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-primary-600 flex-wrap">
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <IoCall className="text-tertiary-500" />
                          {member.phone}
                        </span>
                      )}
                      {member.email && (
                        <span className="flex items-center gap-1">
                          <IoMail className="text-tertiary-500" />
                          {member.email}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-primary-200 rounded text-xs">
                        {member.role || "player"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                {member.role !== "team_leader" && onRemoveMember && (
                  <button
                    onClick={() =>
                      onRemoveMember(member._id || member.id || index)
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <IoTrash />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-primary-600 py-8">
            No team members yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default RosterManagement;
