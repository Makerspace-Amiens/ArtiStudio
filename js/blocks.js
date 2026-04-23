// Custom ArtiBot block definitions
// Labels are read from Blockly.Msg at block instantiation time.
// Call setArtiBotMsg(lang) before re-injecting the workspace to update labels.

function setArtiBotMsg(lang) {
  const t = I18N[lang];
  Blockly.Msg.ARTIBOT_FORWARD_LABEL   = t.block_forward;
  Blockly.Msg.ARTIBOT_FORWARD_UNIT    = t.block_forward_unit;
  Blockly.Msg.ARTIBOT_BACKWARD_LABEL  = t.block_backward;
  Blockly.Msg.ARTIBOT_BACKWARD_UNIT   = t.block_backward_unit;
  Blockly.Msg.ARTIBOT_TURN_LEFT_LABEL = t.block_turn_left;
  Blockly.Msg.ARTIBOT_TURN_RIGHT_LABEL= t.block_turn_right;
  Blockly.Msg.ARTIBOT_TURN_UNIT       = t.block_turn_left_unit;
  Blockly.Msg.ARTIBOT_PEN_UP_LABEL    = t.block_pen_up;
  Blockly.Msg.ARTIBOT_PEN_DOWN_LABEL  = t.block_pen_down;
  Blockly.Msg.ARTIBOT_WAIT_LABEL      = t.block_wait;
  Blockly.Msg.ARTIBOT_WAIT_UNIT       = t.block_wait_unit;
  Blockly.Msg.ARTIBOT_GO_HOME_LABEL   = t.block_go_home;
  Blockly.Msg.ARTIBOT_CLEAR_LABEL     = t.block_clear;
}

function defineArtiBotBlocks() {
  const COLOR_MOVE = 210;
  const COLOR_PEN  = 30;
  const COLOR_CTRL = 120;

  Blockly.Blocks['artibot_forward'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_FORWARD_LABEL || 'Avancer de')
        .appendField(new Blockly.FieldNumber(100, 0, 99999, 1), 'MM')
        .appendField(Blockly.Msg.ARTIBOT_FORWARD_UNIT || 'mm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOVE);
    }
  };

  Blockly.Blocks['artibot_backward'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_BACKWARD_LABEL || 'Reculer de')
        .appendField(new Blockly.FieldNumber(100, 0, 99999, 1), 'MM')
        .appendField(Blockly.Msg.ARTIBOT_BACKWARD_UNIT || 'mm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOVE);
    }
  };

  Blockly.Blocks['artibot_turn_left'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_TURN_LEFT_LABEL || 'Tourner à gauche de')
        .appendField(new Blockly.FieldNumber(90, 0, 360, 1), 'DEG')
        .appendField(Blockly.Msg.ARTIBOT_TURN_UNIT || '°');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOVE);
    }
  };

  Blockly.Blocks['artibot_turn_right'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_TURN_RIGHT_LABEL || 'Tourner à droite de')
        .appendField(new Blockly.FieldNumber(90, 0, 360, 1), 'DEG')
        .appendField(Blockly.Msg.ARTIBOT_TURN_UNIT || '°');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_MOVE);
    }
  };

  Blockly.Blocks['artibot_pen_up'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_PEN_UP_LABEL || 'Lever le stylo');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PEN);
    }
  };

  Blockly.Blocks['artibot_pen_down'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_PEN_DOWN_LABEL || 'Baisser le stylo');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PEN);
    }
  };

  Blockly.Blocks['artibot_wait'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_WAIT_LABEL || 'Attendre')
        .appendField(new Blockly.FieldNumber(1, 0, 60, 0.1), 'SECONDS')
        .appendField(Blockly.Msg.ARTIBOT_WAIT_UNIT || 'secondes');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CTRL);
    }
  };

  Blockly.Blocks['artibot_go_home'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_GO_HOME_LABEL || 'Retour à la position initiale');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CTRL);
    }
  };

  Blockly.Blocks['artibot_clear'] = {
    init() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.ARTIBOT_CLEAR_LABEL || 'Effacer le dessin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_CTRL);
    }
  };
}
