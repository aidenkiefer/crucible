export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-coliseum-black p-6">
      <div className="panel p-8 text-center inner-shadow max-w-md w-full">
        <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-red mb-4">
          Access Denied
        </h1>
        <p className="text-coliseum-sand/70 mb-6">
          You do not have administrator privileges.
        </p>
        <a
          href="/"
          className="btn-primary inline-block"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}
