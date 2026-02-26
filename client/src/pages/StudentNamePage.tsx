import { Logo } from '../components/Logo';
import { useAppDispatch } from '../store/hooks';
import { connectAsStudent } from '../store/socketMiddleware';

export default function StudentNamePage() {
  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    if (!name) return;
    dispatch(connectAsStudent(name));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Logo size="md" />

        <h1 className="mt-8 text-3xl font-light text-gray-900">
          Let's <span className="font-bold">Get Started</span>
        </h1>

        <p className="mt-3 text-center text-gray-500 text-sm leading-relaxed max-w-sm">
          If you're a student, you'll be able to{' '}
          <span className="font-bold text-gray-700">submit your answers</span>, participate in live
          polls, and see how your responses compare with your classmates
        </p>

        <form onSubmit={handleSubmit} className="mt-10 w-full flex flex-col items-center">
          <label className="self-start text-sm font-medium text-gray-700 mb-2">
            Enter your Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            autoFocus
            maxLength={50}
            required
            className="w-full px-4 py-3 bg-gray-100 rounded-lg border-none outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6C3FE4]/30"
          />

          <button
            type="submit"
            className="mt-8 w-48 py-3 bg-[#6C3FE4] hover:bg-[#5B31CC] text-white rounded-full font-semibold text-sm transition-colors cursor-pointer"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
