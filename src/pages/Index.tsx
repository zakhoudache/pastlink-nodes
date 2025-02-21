import Analysis from './Analysis';
import Flow from './Flow';

export default function HomePage() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div>
        <Analysis />
      </div>
      <div>
        <Flow />
      </div>
    </div>
  );
}