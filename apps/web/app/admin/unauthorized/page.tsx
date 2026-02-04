export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-stone-300 mb-6">
          You do not have administrator privileges.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-amber-600 text-black font-bold uppercase tracking-wide hover:bg-amber-500 transition"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}
