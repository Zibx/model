each widget MUST
  provide methods:
    - state(state, silent): set/get state of widget. any widget state MUST be restorable from this config. If you do animations - you MAY not include it steps here.

  generate events:
    - change(state): on state change

  specify properies:

    - tabbable: if widget HAVE TO handle focus in custom way
    - disabled:
