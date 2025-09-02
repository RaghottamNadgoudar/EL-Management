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
import Link from 'next/link';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { PopoverClose } from '@radix-ui/react-popover';


export default function EventCreate() {
  const router = useRouter();

  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAcademicYear, setEventAcademicYear] = useState('');
  const [eventStartDate, setEventStartDate] = useState<Date | undefined>(undefined);
  const [eventEndDate, setEventEndDate] = useState<Date | undefined>(undefined);
  const [eventRegistrationDeadline, setEventRegistrationDeadline] = useState<Date | undefined>(undefined);


  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // Validate Required Fields
    if (!eventName || !eventDescription || !eventAcademicYear || !eventStartDate || !eventEndDate || !eventRegistrationDeadline) {
      alert('Please fill in all required fields.');
      return;
    }


    const newEvent = {
      name: eventName,
      description: eventDescription,
      academicYear: eventAcademicYear,
      startDate: eventStartDate,
      endDate: eventEndDate,
      registrationDeadline: eventRegistrationDeadline,
      phases: []
    };


    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        // If the event creation was successful, redirect to the events page.
        router.push('/admin/events');
      } else {
        // If there was an error, display an alert.
        alert('Failed to create event. Please try again.');
      }
    } catch (error) {
      // Catch any errors that occur during the fetch and display an alert.
      alert('An error occurred while creating the event. Please check your connection and try again.');
      console.error('Error creating event:', error);
    }
  };


  return (
    <div className=\"flex justify-center items-center\">\n      <Card className=\"w-[80%]\">\n        <CardHeader>\n          <CardTitle>Create Event</CardTitle>\n          <CardDescription>Fill out the form below to create a new event.</CardDescription>\n        </CardHeader>\n        <CardContent>\n          <form onSubmit={handleSubmit} className=\"space-y-4\">\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"name\">Event Name</Label>\n              <Input type=\"text\" id=\"name\" placeholder=\"Event Name\" value={eventName} onChange={(e) => setEventName(e.target.value)} />\n            </div>\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"description\">Event Description</Label>\n              <Textarea id=\"description\" placeholder=\"Event Description\" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />\n            </div>\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"academicYear\">Academic Year</Label>\n              <Input type=\"text\" id=\"academicYear\" placeholder=\"Academic Year\" value={eventAcademicYear} onChange={(e) => setEventAcademicYear(e.target.value)} />\n            </div>\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"startDate\">Start Date</Label>\n              <Popover>\n                <PopoverTrigger asChild>\n                  <Button\n                    variant={\'outline\'}\n                    className={\cn(\n                      \'w-[240px] justify-start text-left font-normal\',\n                      !eventStartDate && \'text-muted-foreground\'\n                    )}\n                  >\n                    <CalendarIcon className=\"mr-2 h-4 w-4\" />\n                    {eventStartDate ? (\n                      format(eventStartDate, \'PPP\')\n                    ) : (\n                      <span>Pick a start date</span>\n                    )}\n                  </Button>\n                </PopoverTrigger>\n                <PopoverContent className=\"w-auto p-0\" align=\"center\" side=\"bottom\">\n                  <Calendar\n                    mode=\"single\"\n                    selected={eventStartDate}\n                    onSelect={setEventStartDate}\n                    disabled={undefined}\n                    initialFocus\n                  />\n                </PopoverContent>\n              </Popover>\n            </div>\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"endDate\">End Date</Label>\n              <Popover>\n                <PopoverTrigger asChild>\n                  <Button\n                    variant={\'outline\'}\n                    className={\cn(\n                      \'w-[240px] justify-start text-left font-normal\',\n                      !eventEndDate && \'text-muted-foreground\'\n                    )}\n                  >\n                    <CalendarIcon className=\"mr-2 h-4 w-4\" />\n                    {eventEndDate ? (\n                      format(eventEndDate, \'PPP\')\n                    ) : (\n                      <span>Pick an end date</span>\n                    )}\n                  </Button>\n                </PopoverTrigger>\n                <PopoverContent className=\"w-auto p-0\" align=\"center\" side=\"bottom\">\n                  <Calendar\n                    mode=\"single\"\n                    selected={eventEndDate}\n                    onSelect={setEventEndDate}\n                    disabled={undefined}\n                    initialFocus\n                  />\n                </PopoverContent>\n              </Popover>\n            </div>\n            <div className=\"grid w-full max-w-sm items-center gap-1.5\">\n              <Label htmlFor=\"registrationDeadline\">Registration Deadline</Label>\n              <Popover>\n                <PopoverTrigger asChild>\n                  <Button\n                    variant={\'outline\'}\n                    className={\cn(\n                      \'w-[240px] justify-start text-left font-normal\',\n                      !eventRegistrationDeadline && \'text-muted-foreground\'\n                    )}\n                  >\n                    <CalendarIcon className=\"mr-2 h-4 w-4\" />\n                    {eventRegistrationDeadline ? (\n                      format(eventRegistrationDeadline, \'PPP\')\n                    ) : (\n                      <span>Pick a registration deadline</span>\n                    )}\n                  </Button>\n                </PopoverTrigger>\n                <PopoverContent className=\"w-auto p-0\" align=\"center\" side=\"bottom\">\n                  <Calendar\n                    mode=\"single\"\n                    selected={eventRegistrationDeadline}\n                    onSelect={setEventRegistrationDeadline}\n                    disabled={undefined}\n                    initialFocus\n                  />\n                </PopoverContent>\n              </Popover>\n            </div>\n            <Button type=\"submit\">Create Event</Button>\n          </form>\n        </CardContent>\n      </Card>\n    </div>



  );
}
