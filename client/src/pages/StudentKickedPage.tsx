import { Logo } from '../components/Logo';

export default function StudentKickedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <Logo size="md" />

      <h2 className="mt-6 text-4xl font-bold text-gray-900 text-center">
        You've been Kicked out !
      </h2>
      <p className="mt-4 text-gray-400 text-center max-w-md leading-relaxed">
        Looks like the teacher had removed you from the poll system .Please
        Try again sometime.
      </p>
    </div>
  );
}
