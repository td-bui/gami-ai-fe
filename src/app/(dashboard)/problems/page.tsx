"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import Image from "next/image";
import TopicList from "@/components/TopicList";
import ProblemsTable from "@/components/ProblemsTable";
import FilterModal from "@/components/FilterModal";
import { authFetch } from "@/utils/authFetch";

const difficulties = ["easy", "medium", "hard"];
const statuses = ["solved", "unsolved"];
const PAGE_SIZE = 5; // Number of problems to load per scroll

async function fetchTopics() {
	const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	const res = await authFetch(`${apiBaseUrl}/api/topics/public`);
	if (!res.ok) throw new Error("Failed to load topics");
	return res.json();
}

async function fetchProblems({
    page = 0,
    size = PAGE_SIZE,
    name,
    difficulty,
    topic,
    solved,
    userId,
}: {
    page?: number;
    size?: number;
    name?: string;
    difficulty?: string | null;
    topic?: string | null;
    solved?: string | null;
    userId?: number | null;
}) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (name) params.append("name", name);
    if (difficulty && difficulty !== "all") params.append("difficulty", difficulty);
    if (topic && topic !== "all") params.append("topic", topic);
    if (solved && solved !== "all") params.append("solved", solved);
    if (userId) params.append("userId", userId.toString());

    const res = await authFetch(`${apiBaseUrl}/api/problems/search?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load problems");
    return res.json();
}

type Problem = {
  id: number;
  title: string;
  difficulty: string;
  topicName: string;
  isSolved: boolean;
};

export default function ProblemsPage() {
    const [expanded, setExpanded] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [topics, setTopics] = useState([]);
    const [topicsLoading, setTopicsLoading] = useState(true);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [problemsTotal, setProblemsTotal] = useState(0);
    const [problemsPage, setProblemsPage] = useState(0);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [searchName, setSearchName] = useState(""); // for search bar
    const [searchInput, setSearchInput] = useState("");

    const listEndRef = useRef<HTMLDivElement>(null);
    const filterBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTopics()
            .then((data) => setTopics(data))
            .catch(() => setTopics([]))
            .finally(() => setTopicsLoading(false));
    }, []);

    // Infinite scroll handler using Intersection Observer
    useEffect(() => {
      if (!listEndRef.current) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            problems.length < problemsTotal &&
            !problemsLoading
          ) {
            setProblemsLoading(true);
            fetchProblems({
              page: problemsPage + 1,
              size: PAGE_SIZE,
              name: searchName,
              difficulty: selectedDifficulty,
              topic: selectedTopic,
              solved: selectedStatus,
            })
              .then((data) => {
                setProblems((prev) => [...prev, ...(data.content || [])]);
                setProblemsPage((prev) => prev + 1);
              })
              .finally(() => setProblemsLoading(false));
          }
        },
        { threshold: 1 }
      );
      observer.observe(listEndRef.current);
      return () => observer.disconnect();
    }, [problems, problemsPage, problemsTotal, problemsLoading, searchName, selectedDifficulty, selectedTopic, selectedStatus]);

    // Load problems on filter/search change
    useEffect(() => {
        setProblemsLoading(true);
        fetchProblems({
            page: 0,
            size: PAGE_SIZE,
            name: searchName,
            difficulty: selectedDifficulty,
            topic: selectedTopic,
            solved: selectedStatus,
            // userId: currentUserId, // add if you have user info
        })
            .then((data) => {
                setProblems(data.content || []);
                setProblemsTotal(data.totalElements || 0);
                setProblemsPage(0);
            })
            .catch(() => setProblems([]))
            .finally(() => setProblemsLoading(false));
    }, [searchName, selectedDifficulty, selectedTopic, selectedStatus]);

    // Random problem handler (now uses loaded problems)
    const handleRandom = () => {
        const availableProblems = problems.length > 0 ? problems : [];
        const random = availableProblems[Math.floor(Math.random() * availableProblems.length)];
        if (random) {
            window.location.href = `/problem-detail?problemId=${random.id}`;
        }
    };

    // Show only the first 5 topics when not expanded
    const visibleTopics = expanded ? topics : topics.slice(0, 5);
    const visibleProblems = problems;

    return (
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-4 rounded-md relative">
            {/* Topics, Filter, and Random */}
            {topicsLoading ? (
              <div className="text-center text-gray-400 py-4">Loading topics...</div>
            ) : (
              <TopicList
                topics={topics}
                expanded={expanded}
                onExpand={() => setExpanded((prev) => !prev)}
                selectedTopic={selectedTopic}
                onTopicClick={(topicCode: string) => {
                  setSelectedTopic(prev =>
                    prev === topicCode ? null : topicCode
                  );
                }}
              />
            )}
            {/* Problems Table */}
            <section className="w-full pb-8 relative">
              <div className="flex items-center justify-between mb-4">
                {/* SEARCH BAR */}
                <div className="hidden md:flex items-center gap-1 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
                  <Image src="/search.png" alt="" width={14} height={14} />
                  <input
                    type="text"
                    placeholder="Search Problem..."
                    className="w-[180px] p-2 bg-transparent outline-none"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") setSearchName(searchInput); }}
                  />
                  <button onClick={() => setSearchName(searchInput)}>
                    <Image src="/search.png" alt="" width={14} height={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter Icon and Modal */}
                  <div className="relative group" ref={filterBtnRef}>
                    <button
                      className="flex items-center justify-center h-8 w-8 rounded transition hover:bg-gray-100 z-30"
                      onClick={() => setShowFilter(true)}
                      aria-label="Show filters"
                      type="button"
                    >
                      {/* Filter SVG */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 4.5h18m-16.5 6h15m-13.5 6h12"
                        />
                      </svg>
                    </button>
                    <span className="absolute left-1/2 -translate-x-1/2 top-10 z-40 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition">
                      Filter
                    </span>
                  </div>
                  {/* Shuffle (Random) Icon with Tooltip */}
                  <div className="relative group">
                    <button
                      className="flex items-center justify-center h-8 w-8 rounded transition hover:bg-gray-100"
                      onClick={handleRandom}
                      aria-label="Random problem"
                      type="button"
                    >
                      {/* Shuffle SVG */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 3h5v5m0 0L10 19m11-11h-5m-2 8H3m0 0l4-4m-4 4l4 4"
                        />
                      </svg>
                    </button>
                    <span className="absolute left-1/2 -translate-x-1/2 top-10 z-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition">
                      Random
                    </span>
                  </div>
                </div>
              </div>
              <ProblemsTable problems={problems} />
              <div ref={listEndRef}></div>
              {problemsLoading && (
                <div className="text-center text-gray-400 py-4">Loading problems...</div>
              )}
              {problems.length >= problemsTotal && problemsTotal > 0 && (
                <div className="text-center text-gray-400 py-4">No more problems to load.</div>
              )}
            </section>
          </div>
        </div>
        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <EventCalendar />
          <Announcements />
        </div>

        {/* Modal for Filter */}
        <FilterModal
          show={showFilter}
          onClose={() => setShowFilter(false)}
          statuses={statuses}
          difficulties={difficulties}
          topics={topics}
          selectedStatus={selectedStatus}
          selectedDifficulty={selectedDifficulty}
          selectedTopic={selectedTopic}
          setSelectedStatus={setSelectedStatus}
          setSelectedDifficulty={setSelectedDifficulty}
          setSelectedTopic={setSelectedTopic}
        />
      </div>
    );
}
