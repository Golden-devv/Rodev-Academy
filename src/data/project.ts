// ── Project 01 task data ──────────────────────────────────────────────────

export interface ProjectTask {
  tab: 'ls' | 'ss';
  label: string;
  text: string;
  starter: string;
  check: (code: string) => boolean;
  hint: string;
  pass: string;
}

export const P1_TASKS: ProjectTask[] = [
  {
    tab: 'ls',
    label: 'ClickScript',
    text: '<strong>Task 1 of 5</strong> — Get references to your UI elements.<br/>Write: <code>local button = script.Parent.ClickButton</code><br/>Write: <code>local coinLabel = script.Parent.CoinLabel</code>',
    starter: '-- ClickScript (LocalScript inside ClickingGui)\n-- Reference the button and label:\n\nlocal button = \nlocal coinLabel = ',
    check: (c) => /local\s+button\s*=\s*script\.Parent/.test(c) && /local\s+coinLabel\s*=\s*script\.Parent/.test(c),
    hint: 'local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel',
    pass: 'You referenced both UI elements. script.Parent = ClickingGui. Then .ClickButton goes one level deeper.',
  },
  {
    tab: 'ls',
    label: 'ClickScript',
    text: '<strong>Task 2 of 5</strong> — Wire up the click event.<br/>Add <code>local coins = 0</code>, then <code>button.MouseButton1Click:Connect(function() ... end)</code><br/>Inside: increment coins, update <code>coinLabel.Text</code>.',
    starter: 'local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel\nlocal coins = 0\n\nbutton.MouseButton1Click:Connect(function()\n  -- add 1 to coins\n  -- update coinLabel.Text\nend)',
    check: (c) => /MouseButton1Click\s*:\s*Connect/.test(c) && /coins\s*=\s*coins\s*\+\s*1/.test(c) && /\.Text\s*=/.test(c),
    hint: 'coins = coins + 1\ncoinLabel.Text = "Coins: " .. coins',
    pass: 'The click event is live. Every click adds 1 coin and updates the label in real time.',
  },
  {
    tab: 'ss',
    label: 'LeaderboardScript',
    text: '<strong>Task 3 of 5</strong> — Server leaderboard setup.<br/><code>Players.PlayerAdded:Connect()</code> → create a <code>leaderstats</code> Folder with a <code>Coins</code> IntValue set to 0.',
    starter: '-- LeaderboardScript (Script in ServerScriptService)\nlocal Players = game:GetService("Players")\n\nPlayers.PlayerAdded:Connect(function(player)\n  local ls = Instance.new("Folder")\n  ls.Name = "leaderstats"\n  ls.Parent = player\n\n  local coins = Instance.new("IntValue")\n  coins.Name = "Coins"\n  coins.Value = 0\n  coins.Parent = ls\nend)',
    check: (c) => /Players\.PlayerAdded\s*:\s*Connect/.test(c) && /leaderstats/.test(c) && /IntValue/.test(c),
    hint: 'Read the starter code — it IS the answer. Understand each line.',
    pass: 'The leaderboard is set up. Roblox auto-reads the "leaderstats" folder name and displays it in-game.',
  },
  {
    tab: 'ss',
    label: 'LeaderboardScript',
    text: '<strong>Task 4 of 5</strong> — Listen for the RemoteEvent on the server.<br/>Add: <code>local event = ReplicatedStorage:WaitForChild("AddCoin")</code><br/>Then: <code>event.OnServerEvent:Connect(function(player) ... end)</code>',
    starter: 'local Players = game:GetService("Players")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal event = ReplicatedStorage:WaitForChild("AddCoin")\n\n-- PlayerAdded setup (already done)\n\nevent.OnServerEvent:Connect(function(player)\n  local ls = player:FindFirstChild("leaderstats")\n  if ls then\n    ls.Coins.Value = ls.Coins.Value + 1\n  end\nend)',
    check: (c) => /OnServerEvent\s*:\s*Connect/.test(c) && /WaitForChild/.test(c),
    hint: 'event.OnServerEvent:Connect(function(player)\n  ls.Coins.Value = ls.Coins.Value + 1\nend)',
    pass: 'The server now listens for clicks. The leaderboard updates live.',
  },
  {
    tab: 'ls',
    label: 'ClickScript',
    text: '<strong>Task 5 of 5</strong> — Fire the RemoteEvent from the client.<br/>Inside the click function, add: <code>game.ReplicatedStorage.AddCoin:FireServer()</code>',
    starter: 'local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel\nlocal event = game.ReplicatedStorage:WaitForChild("AddCoin")\nlocal coins = 0\n\nbutton.MouseButton1Click:Connect(function()\n  coins = coins + 1\n  coinLabel.Text = "Coins: " .. coins\n  -- fire the server:\n  \nend)',
    check: (c) => /FireServer\s*\(\s*\)/.test(c),
    hint: 'event:FireServer()',
    pass: 'COMPLETE! Client fires → server updates leaderboard. Your clicking game is fully wired.',
  },
];

/** Which step index maps to which task index in P1_TASKS */
export const P1_STEP_TASK: Record<number, number> = { 4: 0, 5: 1, 6: 2, 7: 4 };

/** Which tab to activate per step */
export const P1_STEP_TAB: Record<number, 'ls' | 'ss'> = { 4: 'ls', 5: 'ls', 6: 'ss', 7: 'ls' };
