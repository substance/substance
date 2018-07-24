# Deprecated API

We have moved away from some of the earlier API because it
turned out not to be sufficient for more complex applications.
Particularly, `EditorSession` was getting to heavy with lots of
different managers.
In general we think that this development was going into the wrong
direction, Substance taking too much responsibility for application
decisions.

We are now trying to make core implementations more flexible,
leaving more responsibility but also flexibility to the application.

Here we keep the former implementation, to allow a smoother transition
to a new solution.