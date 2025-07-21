import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const Sidebar = ({
  modulesLessons,
  onLessonSelect,
  selectedLessonId,
}: {
  modulesLessons: any[];
  onLessonSelect: (lessonId: number) => void;
  selectedLessonId: number | null;
}) => {
  const [expandedLessons, setExpandedLessons] = useState<{ [lessonId: number]: boolean }>({});

  // Group lessons by module
  const modules = modulesLessons.reduce((acc: any, item: any) => {
    if (!acc[item.moduleId]) {
      acc[item.moduleId] = {
        moduleTitle: item.moduleTitle,
        lessons: [],
      };
    }
    acc[item.moduleId].lessons.push(item);
    return acc;
  }, {});

  // Helper to check if a lesson has sub-lessons
  const hasSubLessons = (mod: any, lessonId: number) =>
    mod.lessons.some((l: any) => l.isSubLesson && l.parentLessonId === lessonId);

  return (
    <aside className="w-full h-full overflow-y-auto bg-gradient-to-b from-blue-50 to-white border-r shadow-sm">
      <nav className="p-4 h-full">
        {Object.entries(modules).map(([moduleId, mod]: any, idx, arr) => (
          <div key={moduleId} className={`mb-6 ${idx < arr.length - 1 ? "border-b border-blue-100 pb-4" : ""}`}>
            <div className="font-bold mb-3 text-xl uppercase tracking-wide">
              {mod.moduleTitle}
            </div>
            <ul>
              {mod.lessons
                .filter((l: any) => !l.isSubLesson)
                .sort((a: any, b: any) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
                .map((lesson: any) => {
                  const showArrow = hasSubLessons(mod, lesson.lessonId);
                  const expanded = expandedLessons[lesson.lessonId];
                  return (
                    <li key={lesson.lessonId} className="mb-1">
                      <div className="flex items-center">
                        <button
                          className={`flex-1 text-left px-4 py-1 rounded-lg transition-all duration-150 flex items-center justify-between gap-2 text-sm
                            ${lesson.lessonId === selectedLessonId
                              ? "bg-[#687FE5] text-white font-bold ring-1 ring-[#687FE5] shadow border-l-4 border-[#687FE5] scale-[1.03]"
                              : "hover:bg-[#e6eafd] hover:scale-[1.01] text-black"
                            }`}
                          onClick={() => onLessonSelect(lesson.lessonId)}
                        >
                          <span className="flex items-center gap-2">
                            <FaCheckCircle
                              className={lesson.completed ? "text-green-500 mr-2" : "text-gray-300 mr-2"}
                              title={lesson.completed ? "Completed" : "Not completed"}
                            />
                            <span className="truncate">{lesson.lessonTitle}</span>
                          </span>
                          {/* Arrow icon for expandable lessons, now inside the button on the right */}
                          {showArrow ? (
                            <span
                              className="ml-2 p-1 cursor-pointer"
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedLessons(prev => ({
                                  ...prev,
                                  [lesson.lessonId]: !prev[lesson.lessonId],
                                }));
                              }}
                              aria-label={expanded ? "Collapse sub-lessons" : "Expand sub-lessons"}
                            >
                              {expanded ? (
                                <FaChevronDown className="text-gray-200 group-hover:text-white" />
                              ) : (
                                <FaChevronRight className="text-gray-400 group-hover:text-white" />
                              )}
                            </span>
                          ) : (
                            <span className="w-5 ml-2" />
                          )}
                        </button>
                      </div>
                      {/* Render sub-lessons if expanded */}
                      {showArrow && expanded && (
                        <ul className="ml-8 mt-1">
                          {mod.lessons
                            .filter(
                              (sl: any) =>
                                sl.isSubLesson && sl.parentLessonId === lesson.lessonId
                            )
                            .sort((a: any, b: any) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
                            .map((sub: any) => (
                              <li key={sub.lessonId} className="mb-1">
                                <button
                                  className={`w-full text-left px-3 py-1 rounded text-sm transition-all duration-150 flex items-center gap-2
                                    ${sub.lessonId === selectedLessonId
                                      ? "bg-[#687FE5] text-white font-bold ring-2 ring-[#687FE5] shadow border-l-4 border-[#687FE5] scale-[1.02]"
                                      : "hover:bg-[#e6eafd] text-black"
                                    }`}
                                  onClick={() => onLessonSelect(sub.lessonId)}
                                >
                                  <FaCheckCircle
                                    className={sub.completed ? "text-green-500 mr-2" : "text-gray-300 mr-2"}
                                    title={sub.completed ? "Completed" : "Not completed"}
                                  />
                                  <span className="truncate">{sub.lessonTitle}</span>
                                </button>
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;