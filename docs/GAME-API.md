# Academy game API

The game supplies `game` in Python and a static `Game` class in C#. These are helpers belonging to CodeQuest, not built-in language features. The child's editable code contains the actual decisions, loops, values, functions and classes.

| Python | C# | Effect |
| --- | --- | --- |
| `game.move("right")` | `Game.Move("right");` | Move one square. Also `left`, `up`, `down`. Water and world edges cannot be crossed. |
| `game.robot("Pip", 5, True)` | `Game.Robot("Pip", 5, true);` | Set a robot's name, energy and ready state. |
| `game.supply(6)` | `Game.Supply(6);` | Send a calculated quantity of cells to a repair. |
| `game.energy()` | `Game.Energy()` | Read the world's power gauge. |
| `game.needed()` | `Game.Needed()` | Read the power goal. |
| `game.gate(True)` | `Game.Gate(true);` | Open a gate if it really has sufficient power. |
| `game.sensor()` | `Game.Sensor()` | Read `"clear"` or `"blocked"`. |
| `game.destination()` | `Game.Destination()` | Read the building on a delivery label. |
| `game.route("left")` | `Game.Route("left");` | Take `left`/`right`, or a named building route in a delivery mission. |
| `game.count()` | `Game.Count()` | Read the number of plants/signals in a row. |
| `game.water(0)` | `Game.Water(0);` | Water plant 0. Positions start at zero. |
| `game.light(0)` | `Game.Light(0);` | Activate signal 0. |
| `game.charge(1)` | `Game.Charge(1);` | Add between one and ten power cells. |
| `game.repair("bridge")` | `Game.Repair("bridge");` | Repair a named place in the current world. |
| `game.delivery_list()` | `Game.DeliveryList()` | Read the list/array of parcels, including duplicates. |
| `game.deliver("tools")` | `Game.Deliver("tools");` | Deliver one parcel from that list. |
| `game.district()` | `Game.District()` | Read the current district's repair places. |
| `game.lift(2, True)` | `Game.Lift(2, true);` | Send a powered and ready lift to a floor. |
| `game.store(5)` | `Game.Store(5);` | Set world power, useful in the sandbox. |
| `game.collect()` | `Game.Collect();` | Take one cell from a finite store. |
| `print("Hello!")` | `Console.WriteLine("Hello!");` | Output real program text and display it on the beacon. |

Whole-number quantities and indices are range checked. Repair names and delivery items must belong to the challenge; the sandbox allows additional exploration. Sensors read the worker simulation synchronously, so `while game.energy() < game.needed()` responds to the preceding charge commands.

For C#, the Academy supplies global imports for `System`, `System.Collections.Generic` and `System.Linq`. The API source is in `dist/csharp-api.txt`, compiled separately from the child's editable source. Python's API and execution harness are in `dist/python-runner.py`. The visible editor identifies supplied starter/example lines separately from lines changed locally.

## A Python idea

```python
for plant in range(game.count()):
    game.water(plant)
```

## A C# idea

```csharp
for (int light = 0; light < Game.Count(); light++)
{
    Game.Light(light);
}
```

These are real programs. Their executed API calls generate the world actions. Different correct programs are accepted when their behaviour satisfies the goal and their executed constructs meet the mission's programming concept.
