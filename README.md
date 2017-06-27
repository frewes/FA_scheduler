# FIRST Australia Scheduler

This was developed to produce competition schedules, primarily for FIRST LEGO League (FLL) events in Australia.  
It should be reasonably generic, in that you can customize most of the event details, but it comes preloaded for a standard FLL event.
The basic structure of events covered by this scheduler is:
* A group of teams with a team number and a team name.
* Each team participates in two different types of events (for FLL, "Matches" and "Judging").

Currently, it only works for single-day events (multi day events are planned, but are not currently implemented).

The scheduler generates tables for each event and for individual team schedules, as well as generating and downloading PDFs with a basic design and customizable logos.
