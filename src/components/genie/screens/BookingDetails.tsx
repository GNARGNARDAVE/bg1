import { useState } from 'react';

import { Booking, Park } from '@/api/genie';
import Button from '@/components/Button';
import GuestList from '@/components/GuestList';
import Screen from '@/components/Screen';
import { Time } from '@/components/Time';
import { useGenieClient } from '@/contexts/GenieClient';
import { useNav } from '@/contexts/Nav';
import { useRebooking } from '@/contexts/Rebooking';
import { DEFAULT_THEME } from '@/contexts/Theme';

import { ExperienceList } from '../ExperienceList';
import ReturnTime from '../ReturnTime';
import CancelGuests from './CancelGuests';

export default function BookingDetails({ booking }: { booking: Booking }) {
  const { goTo, goBack } = useNav();
  const client = useGenieClient();
  const { name, park, choices, type, start } = booking;
  const isLL = type === 'LL';
  const rebooking = useRebooking();
  const [guests, setGuests] = useState(isLL ? booking.guests : undefined);

  const choicesByPark = new Map([
    [park as Park, []],
    ...client.parks.map(
      park => [park, []] as [Park, Required<typeof booking>['choices']]
    ),
  ]);
  for (const exp of choices || []) choicesByPark.get(exp.park)?.push(exp);

  const parkChoices = [...choicesByPark]
    .filter(([, exps]) => exps.length > 0)
    .map(([park]) => park);
  const theme =
    (!choices ? park : parkChoices.length === 1 ? parkChoices[0] : {}).theme ??
    DEFAULT_THEME;

  return (
    <Screen
      heading={
        'Your ' +
        (isLL
          ? booking.subtype === 'DAS'
            ? 'DAS Return Time'
            : 'Lightning Lane'
          : 'Reservation')
      }
      theme={theme}
      buttons={
        booking.modifiable && (
          <Button onClick={() => rebooking.begin(booking)}>Modify</Button>
        )
      }
    >
      {
        <div
          className={`-mx-3 px-2 py-1 text-center ${theme.bg} text-white text-sm font-semibold uppercase`}
        >
          <Time date={start.date} />
        </div>
      }
      {choices ? (
        <h2>Multiple Experiences</h2>
      ) : (
        <>
          <h2>{name}</h2>
          <div>{park.name}</div>
        </>
      )}
      <ReturnTime {...booking} />
      {choices && (
        <>
          <p>
            <b>{name}</b> was temporarily unavailable during your return time.
            You may redeem this Lightning Lane at one of these replacement
            experiences:
          </p>
          {[...choicesByPark]
            .filter(([, choices]) => choices.length > 0)
            .map(([park, choices]) => (
              <ExperienceList
                heading={park.name}
                experiences={choices}
                bg={park.theme.bg}
                key={park.id}
              />
            ))}
        </>
      )}
      <div className="flex mt-4">
        <h3 className="inline mt-0">Your Party</h3>
        {booking.cancellable && guests && (
          <Button
            type="small"
            onClick={() => {
              goTo(
                <CancelGuests
                  booking={{ ...booking, guests }}
                  onCancel={remainingGuests => {
                    if (remainingGuests.length > 0) {
                      setGuests(remainingGuests);
                    } else {
                      goBack();
                    }
                  }}
                />
              );
            }}
            className="ml-3"
          >
            Cancel
          </Button>
        )}
      </div>
      <GuestList
        guests={guests || booking.guests}
        conflicts={
          guests &&
          Object.fromEntries(
            guests
              .filter(g => (g.redemptions ?? 1) !== 1)
              .map(g => [g.id, `Redemptions left: ${g.redemptions}`])
          )
        }
      />
    </Screen>
  );
}
