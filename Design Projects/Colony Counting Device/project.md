---
title: Colony Counting Device
category: Design
order: 30
summary: Foot-pedal actuated bacterial colony counter for hands-free counting in a BSL-3 lab.
images:
  - colony1.jpg
  - colony2.jpg
cta_label: View Co-Lab Project
cta_url: https://colab.duke.edu/project/colony-counting-device/
---

### Overview
For this project, commissioned by a postdoc researcher, we were asked to design a device to assist researchers with counting the bacteria colonies formed on petri dishes. Their prior workflow involved counting hundreds of colonies for each tray and keeping track of the total mentally. This had the potential for operator error.

The constraints included:

- This device was going to be used in a BSL-3 lab, so once it entered the lab, it could not be easily retrieved.
- It needed to allow the researcher to count many petri dishes without removing their hands from the fume hood. Their prior workflow required them to leave the fume hood after each petri dish to record the number of colonies. The researchers would frequently count dozens of petri dishes in one sitting, so this added lots of wasted time.
- It needed to allow the researcher to increment the colony count on each tray as well as decrement the count in case they incremented too many times accidentally.

The device we designed was powered by an Arduino microcontroller, and had a display to show the colony count for the current petri dish. It had three foot pedals - two were used for "plus" and "minus" functions, and the last pedal was used for switching modes between "small adjustment", "large adjustment", and "switch tray."

The small adjustment allowed for incrementing and decrementing by 1 colony at a time. The large adjustment allowed for adding or subtracting 10 colonies at a time. The switch tray mode allowed the user to move on to the next petri dish or return to a previous dish.

This device improved their workflow significantly by eliminating the need to leave the fume hood between petri dishes.

I mentored my student employees to work on this project.
