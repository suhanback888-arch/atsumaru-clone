import Link from "next/link";

const features = [
  { icon: "📊", title: "Track progress", desc: "Track your reading progress and continue reading from any device" },
  { icon: "🔖", title: "Bookmark your favorite comics", desc: "Keep track of your favorite comics and never miss a chapter" },
  { icon: "💬", title: "Comment, reply and upvote", desc: "Engage with the community and share your thoughts" },
  { icon: "🔔", title: "Never miss a chapter", desc: "Get notified when new chapters are added to your bookmarked manga" },
  { icon: "📥", title: "Download chapters", desc: "Download chapters for offline reading" },
  { icon: "⚙️", title: "Customize your experience", desc: "Set and save filters to fine tune your browsing experience" },
];

export default function SignupCTA() {
  return (
    <section className="my-12 bg-surface rounded-2xl p-8 border border-white/5">
      <h2 className="text-2xl font-bold text-white text-center mb-2">Have we met before?</h2>
      <p className="text-gray-400 text-center mb-8">Create an account to never lose your progress again</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {features.map((f) => (
          <div key={f.title} className="flex gap-3 p-3 rounded-lg bg-surface-light/50">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/auth"
          className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Create account
        </Link>
        <Link
          href="/auth/login"
          className="bg-surface-light hover:bg-surface-lighter text-gray-300 font-medium px-6 py-2.5 rounded-lg transition-colors border border-white/5"
        >
          Login
        </Link>
      </div>

      <p className="text-center text-xs text-gray-600 mt-4">It&apos;s completely free and always will be</p>
    </section>
  );
}
