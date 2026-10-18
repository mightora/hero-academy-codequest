# ChoreQuest central account

Open **Games** in ChoreQuest at `https://chorequest.heroacademy.app/academy.html`. A parent enables this game for the selected hero. The hero can then press Play/Continue or scan the private launch QR. No parent password, cookie or email enters the game.

On first connection, choose whether to link the current local adventure or create a separate hero. When a ChoreQuest cloud save exists, choose which adventure to continue before replacing it. Existing local saves and token-free backups remain available. Game saves upload automatically after changes; a save conflict pauses replacement until the player chooses. The account panel confirms successful sync, reports pending/offline work, links back to Games and allows disconnection.

Progress and game-only Hero XP return to ChoreQuest. Game XP cannot change pocket money or redeemable chore points. Earlier local achievements are not back-credited on first connection; new milestone credits are deduplicated server-side. NumberQuest retains its answer/challenge/game/treasure event rewards. Parents can disable a game to revoke all its central and legacy connections for that hero.

The game's `academy-client.js` and CSS are vendored from ChoreQuest's `apps/web/src/` and share the same account protocol. The game adapter uploads only the active profile, with credentials kept in a separate browser-storage key and omitted from normal game backups. Access is limited to this game, hero and canonical origin. Cloud saves are bounded to 128 KiB; Reading and NumberQuest cloud practice histories and CodeQuest cloud practice history keep the latest 300 records. Completed levels remain recorded. In-progress questions and mini-games restart; this is profile/adventure synchronisation, not live multiplayer.

Deploy the ChoreQuest migrations 0013/0014 and account API before publishing this client. Existing game play remains available without an account. Offline saves remain on the device until the server confirms upload. Real-device QR scanning and a signed-in production journey are release checks; automated checks alone do not establish those results.
