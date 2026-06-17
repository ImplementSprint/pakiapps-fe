export function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-red-100">
        <h1 className="text-3xl font-black text-red-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <a
          href="/"
          className="inline-block bg-red-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
