## Commands

### Update Localization Keys

`factorio-locale-format-helper.updateKeysFromSource`

Update the target locale file with the keys from the source locale file.

Type `>FLFH: Update Localization Keys` in the search bar to run this command.

- New keys in the source file will be added to the target file.
- Obsolete keys in the target file will be commented out.
- Keys in the target file will be sorted as in the order of the source file.
- Comments in the target file will prefix with ';' and in the source file with will prefix with '#'.

More features that I might add:

- Compare the values between the last modified time of the source and target locale files with git, and add changed values to the target file, so translations won't be outdated.
