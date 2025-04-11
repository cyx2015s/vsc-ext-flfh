## Commands

### Update Localization Keys

Type `>FLFH: Update Localization Keys` in the search bar to run this command.

Update the target locale file with the keys from the source locale file.

- New keys in the source file will be added to the target file.
- Obsolete keys in the target file will be commented out.
- Keys in the target file will be sorted as in the order of the source file.
- Comments in the target file will prefix with ';' and in the source file with will prefix with '#'.

You can also use the button at the start of the file, to only choose the source file only and apply updates on the current file.

Type `>FLFH: Diff Cfg Files` to compare 2 cfg files. The different values will be written to a new file and you can save it for later use.
