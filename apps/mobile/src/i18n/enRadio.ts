import type { Speaker } from '@/game/data/story';

// Mensagens de rádio da história (GDD seção 18.1): abertura (intro) e fechamento (outro) de
// cada mundo e a chegada na Fronteira. Ids em src/game/data/story.ts (radioId).

export type RadioLine = { speaker: Speaker; text: string };
const say = (speaker: Speaker, text: string): RadioLine => ({ speaker, text });

export const RADIO_MESSAGES: Record<string, RadioLine[]> = {
  'w1-intro': [
    say('sheriff', "Sheriff here. The city has fallen. We are hitting the road with what is left."),
    say('sniper', "The truck can take it. I will handle anyone who gets close."),
    say('sheriff', "Deploy troops in front of the wall and stop the horde."),
  ],
  'w1-outro': [say('sheriff', "The Brute is down. Next stop: the city. We need fuel and ammo.")],
  'w2-intro': [say('sniper', "The streets are full of them... some still in uniform."), say('sheriff', "Police or not, nobody gets through.")],
  'w2-outro': [say('sheriff', "The police radio picked up a strange signal from the south. Let us follow it.")],
  'w3-intro': [say('sheriff', "The signal comes from across the swamp. Watch out for bloaters: they explode.")],
  'w3-outro': [say('sniper', "Look what the Swamp Monster carried: a lab badge. \"Project Spore\".")],
  'w4-intro': [say('sheriff', "An abandoned military base. If anyone knows what is happening, it is here.")],
  'w4-outro': [
    say('sniper', "The General's files mention a probe that fell from the sky months before all this."),
    say('sheriff', "From the sky? Then this did not start here..."),
  ],
  'w5-intro': [say('sniper', "So cold... and they cannot feel it."), say('sheriff', "Stay near the truck. Nobody gets lost in the snow.")],
  'w5-outro': [
    say('static', "...anyone listening? This is Doctor Vega."),
    say('vega', "I studied that probe. It brought a spore from space: that is how this started."),
    say('vega', "Come to Tech City. I have weapons that can help."),
  ],
  'w6-intro': [
    say('vega', "Welcome! The spore infects machines as well as people."),
    say('vega', "Try my lab prototypes. The Tesla Tower fries infected circuits."),
  ],
  'w6-outro': [
    say('vega', "The Colossus was a construction robot. If it turned, nothing here is safe."),
    say('sheriff', "Let us find the source. Where is your laboratory?"),
  ],
  'w7-intro': [
    say('vega', "My old laboratory. The samples stayed here... so did my colleagues."),
    say('sniper', "These mutants burn just by getting close. Watch your troops."),
  ],
  'w7-outro': [
    say('vega', "I found the mission map in the Director's office."),
    say('vega', "The spore came from a hive orbiting Mars. It is still alive."),
  ],
  'w8-intro': [say('vega', "The Launch Site. We have a rocket ready."), say('sheriff', "Then we hold the horde until the countdown ends.")],
  'w8-outro': [
    say('vega', "Fuel topped up. Cleared for launch!"),
    say('sheriff', "What about the truck, Doctor?"),
    say('vega', "It comes too. I fitted the turret to the module."),
  ],
  'w9-intro': [
    say('vega', "Orbital station in sight. The crew... is not responding."),
    say('sniper', "Without gravity they float over barricades. Shoot before they arrive."),
  ],
  'w9-outro': [say('sniper', "The Commander had the lunar base codes."), say('vega', "Next stop: the Moon.")],
  'w10-intro': [say('vega', "Low gravity: they jump far. Something huge is burrowing below.")],
  'w10-outro': [
    say('vega', "The Lunar Worm tunneled to the antenna. The Hive signal is stronger."),
    say('sheriff', "Mars, then."),
  ],
  'w11-intro': [
    say('sheriff', "Red as far as we can see... and a storm is coming."),
    say('vega', "These xenos are not human zombies. They are what the Hive creates."),
  ],
  'w11-outro': [say('vega', "I found the Hive. It is alive and calling them."), say('sniper', "Then we will go silence that thing.")],
  'w12-intro': [
    say('vega', "This is where it all began. Destroy the pods before they hatch."),
    say('vega', "And the Queen... she must not leave this place."),
  ],
  'w12-outro': [
    say('vega', "The Queen is down! The spores are dying..."),
    say('vega', "...but the radio is picking up other signals. Other hives on other planets."),
    say('sheriff', "Then the road goes on. Everyone back to the ship."),
  ],
  frontier: [
    say('vega', "Welcome to the Frontier. Every planet is different, and the hives grow stronger."),
    say('sheriff', "The farther we go, the better the rewards. Let us go."),
  ],
};
