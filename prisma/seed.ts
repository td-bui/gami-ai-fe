import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  // Users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: `hashed_password${i}`, // In production, use proper password hashing
        role: i === 1 ? "admin" : "user",
        xp: Math.floor(Math.random() * 1000),
        level: Math.floor(Math.random() * 10) + 1,
      },
    });
    users.push(user);
  }

  // Problems
  const difficulties = ["Easy", "Medium", "Hard"];
  const problems = [];
  for (let i = 1; i <= 20; i++) {
    const problem = await prisma.problem.create({
      data: {
        title: `Problem ${i}`,
        description: `Description for problem ${i}`,
        difficulty: difficulties[Math.floor(Math.random() * 3)],
        tags: ["arrays", "strings", "algorithms"],
        constraints: "1 <= n <= 10^5",
        examples: "Input: [1,2,3]\nOutput: [3,2,1]",
        starterCode: "function solution(input) {\n  // Your code here\n}",
        solutionCode: "function solution(input) {\n  return input.reverse();\n}",
        createdById: users[0].id, // First user creates all problems
      },
    });
    problems.push(problem);
  }

  // Test Cases
  for (const problem of problems) {
    for (let i = 1; i <= 3; i++) {
      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          input: `[${i},${i+1},${i+2}]`,
          expectedOutput: `[${i+2},${i+1},${i}]`,
          isPublic: i === 1, // First test case is public
        },
      });
    }
  }

  // Submissions
  for (const user of users) {
    for (let i = 1; i <= 3; i++) {
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: problems[i-1].id,
          code: "function solution(input) { return input.reverse(); }",
          language: "javascript",
          status: "ACCEPTED",
          runtime: Math.random() * 100,
          memory: Math.random() * 50,
        },
      });
    }
  }

  // Badges
  const badges = [];
  const badgeTypes = ["Beginner", "Intermediate", "Expert", "Master", "Legend"];
  for (const type of badgeTypes) {
    const badge = await prisma.badge.create({
      data: {
        name: type,
        description: `${type} level achievement`,
        iconUrl: `/badges/${type.toLowerCase()}.png`,
      },
    });
    badges.push(badge);
  }

  // User Badges
  for (const user of users) {
    await prisma.userBadge.create({
      data: {
        userId: user.id,
        badgeId: badges[0].id, // Everyone gets beginner badge
      },
    });
  }

  // Tracks
  const tracks = [];
  const trackTypes = ["Algorithms", "Data Structures", "Dynamic Programming"];
  for (const type of trackTypes) {
    const track = await prisma.track.create({
      data: {
        title: type,
        description: `Master ${type} concepts`,
      },
    });
    tracks.push(track);
  }

  // Track Problems
  for (const track of tracks) {
    for (let i = 0; i < 5; i++) {
      await prisma.trackProblem.create({
        data: {
          trackId: track.id,
          problemId: problems[i].id,
        },
      });
    }
  }

  // Leaderboard
  for (const user of users) {
    await prisma.leaderboard.create({
      data: {
        userId: user.id,
        rank: Math.floor(Math.random() * users.length) + 1,
        xp: user.xp,
        problemsSolved: Math.floor(Math.random() * problems.length),
      },
    });
  }

  // User Progress
  for (const user of users) {
    for (const problem of problems.slice(0, 5)) {
      await prisma.userProgress.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          solved: Math.random() > 0.5,
          attempts: Math.floor(Math.random() * 5) + 1,
          firstSolved: new Date(),
        },
      });
    }
  }

  // AI Assistance
  for (const user of users) {
    await prisma.aiAssistance.create({
      data: {
        userId: user.id,
        problemId: problems[0].id,
        suggestionType: "HINT",
        aiResponse: "Try using a stack for this problem",
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
