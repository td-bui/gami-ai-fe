import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

const fakeLessons: Event[] = [
  {
    id: "lesson_1",
    title: "Math",
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000),
  },
  {
    id: "lesson_2",
    title: "Science",
    start: new Date(),
    end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
  },
];

const BigCalendarContainer = ({
  // You can keep these props for future use
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  // Use fakeLessons instead of fetching from Prisma
  const schedule = adjustScheduleToCurrentWeek(fakeLessons);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
