export default function AdminPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Admin Page</h1>
      <p className="mt-4 text-lg text-gray-600">
        Welcome to the admin page. Only authorized users can access this page.
      </p>
    </div>
  );
}
