import React from 'react';
import { Calendar } from '@/components/ui/calendar';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
];


interface Event {
  id: string;
  name: string;
  description: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  createdBy: string;
}

interface Phase {
  name: string;
  number: number;
  description: string;
  requirements: string[];
  fileTypes: string[];
  maxFiles: number;
  deadlineDays: number;
}


async function getData(): Promise<Event[]> {
  // Fetch data from your API here.
  const res = await fetch('http://localhost:3000/api/events');
  // URL needs to be changed.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }

  const json = await res.json();

  return json.events;
}

async function getPhaseData(eventId: string): Promise<Phase[]> {
  // Fetch data from your API here.
  const res = await fetch('http://localhost:3000/api/events/getPhases?eventId=\' + eventId);
  // URL needs to be changed.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(\'Failed to fetch phase data\');\n  }

  const json = await res.json();

  return json.phases;
}

export default async function Dashboard() {
  const events = await getData();

  return (
    <>
      <div className=\"flex justify-between\">\n        <h1 className=\"scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0\">Dashboard</h1>\n        <Link href=\"/admin/events/create\"> <Button>Create Event</Button></Link>\n      </div>\n\n      <Card>\n        <CardHeader>\n          <CardTitle>Overview</CardTitle>\n          <CardDescription>Analytics of events.</CardDescription>\n        </CardHeader>\n        <CardContent className=\"pl-2\">\n          <ResponsiveContainer width=\"100%\" height={300}>\n            <BarChart data={data}>\n              <CartesianGrid strokeDasharray=\"3 3\" />\n              <XAxis dataKey=\"name\" />\n              <YAxis />\n              <Tooltip />\n              <Legend />\n              <Bar dataKey=\"pv\" fill=\"#8884d8\" />\n              <Bar dataKey=\"uv\" fill=\"#82ca9d\" />\n            </BarChart>\n          </ResponsiveContainer>\n        </CardContent>\n      </Card>\n\n      <div>\n        <h2\n          className=\"scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0\"\n        >\n          Recent Events\n        </h2>\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4\">\n          {events.map((event) => (\n            <Card key={event.id}>\n              <CardHeader>\n                <CardTitle>{event.name}</CardTitle>\n                <CardDescription>{event.description}</CardDescription>\n              </CardHeader>\n              <CardContent>\n                <p>Academic Year: {event.academicYear}</p>\n                <p>Start Date: {event.startDate}</p>\n                <p>End Date: {event.endDate}</p>\n                <p>Registration Deadline: {event.registrationDeadline}</p>\n              </CardContent>\n              <CardFooter className=\"flex justify-between\">\n                <Link href={\`/admin/events/edit?eventId=${event.id}\`}>\n                  <Button>Edit</Button>\n                </Link>\n              </CardFooter>\n            </Card>\n          ))}\n        </div>\n      </div>\n    </>\n  );\n}\n