import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { HiOutlineBell } from "react-icons/hi";

type NotificationItem = {
  title: string;
  description: string;
  dueDate: string;
  color: string;
};

const notifications: NotificationItem[] = [
  {
    title: "Batas Input Nilai",
    description: "Batas input Nilai UTS",
    dueDate: "February 10, 2024",
    color: "border-orange-400",
  },
  {
    title: "Batas Input Nilai",
    description: "Batas input Nilai UAS",
    dueDate: "March 5, 2024",
    color: "border-green-400",
  },
  {
    title: "Pengumuman",
    description: "Pengisian RPS harus segera dilakukan",
    dueDate: "April 15, 2024",
    color: "border-purple-400",
  },
];

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function RightSidebar() {
  const [value, setDate] = useState<Value>(new Date());

  return (
    <div className="md:w-80 shrink-0 space-y-6 sticky top-6 h-fit">
      {/* Kalender */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-700 mb-2">Semester <strong>Ganjil</strong></p>
        <Calendar
          onChange={setDate}
          value={value}
          locale="id-ID"
          className="REACT-CALENDAR"
        />
      </div>

      {/* Notifikasi */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <HiOutlineBell className="text-lg" />
            Notifikasi
          </h3>
          <a href="#" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <span className="text-sm">›</span>
          </a>
        </div>

        <div className="space-y-3">
          {notifications.map((item, index) => (
            <div
              key={index}
              className={`bg-white border-l-4 ${item.color} rounded-md shadow-sm px-4 py-3 space-y-1 text-sm`}
            >
              <h4 className="font-semibold">{item.title}</h4>
              <p className="text-gray-700">{item.description}</p>
              <p className="text-xs text-gray-500">
                Due Date: <span className="font-medium">{item.dueDate}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
