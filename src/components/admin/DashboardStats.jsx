import { IoPeopleOutline, IoShirtOutline, IoCalendarOutline, IoCashOutline } from "react-icons/io5";
import StatCard from "../dashboard/ui/StatCard";

const DashboardStats = ({ stats }) => {
  const statItems = [
    {
      label: "Total Users",
      value: (stats?.totalUsers || 0).toLocaleString(),
      icon: IoPeopleOutline,
      color: "purple",
      subtitle: "Registered accounts",
    },
    {
      label: "Active Teams",
      value: (stats?.totalTeams || 0).toLocaleString(),
      icon: IoShirtOutline,
      color: "blue",
      subtitle: "Competing rosters",
    },
    {
      label: "Total Events",
      value: (stats?.totalEvents || 0).toLocaleString(),
      icon: IoCalendarOutline,
      color: "green",
      subtitle: "Tournaments & matches",
    },
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: IoCashOutline,
      color: "amber",
      subtitle: "Orders & tournament fees",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          subtitle={stat.subtitle}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
