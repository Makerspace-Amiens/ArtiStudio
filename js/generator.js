// JS code generators for ArtiBot custom blocks
function initJsGenerators() {
  Blockly.JavaScript.INFINITE_LOOP_TRAP = null;

  Blockly.JavaScript['artibot_forward'] = (block) =>
    `robot.forward(${block.getFieldValue('MM')});\n`;

  Blockly.JavaScript['artibot_backward'] = (block) =>
    `robot.backward(${block.getFieldValue('MM')});\n`;

  Blockly.JavaScript['artibot_turn_left'] = (block) =>
    `robot.turnLeft(${block.getFieldValue('DEG')});\n`;

  Blockly.JavaScript['artibot_turn_right'] = (block) =>
    `robot.turnRight(${block.getFieldValue('DEG')});\n`;

  Blockly.JavaScript['artibot_pen_up'] = () => `robot.penUp();\n`;

  Blockly.JavaScript['artibot_pen_down'] = () => `robot.penDown();\n`;

  Blockly.JavaScript['artibot_wait'] = (block) =>
    `robot.wait(${block.getFieldValue('SECONDS')});\n`;

  Blockly.JavaScript['artibot_go_home'] = () => `robot.goHome();\n`;

  Blockly.JavaScript['artibot_clear'] = () => `robot.clear();\n`;
}

// Pseudo-code generator
let _pseudoLang = 'fr';
const pseudoGen = {};

function initPseudoGenerators(lang) {
  _pseudoLang = lang;
}

function blockToPseudo(block, indent = '') {
  if (!block) return '';
  const t = I18N[_pseudoLang];
  let code = '';

  switch (block.type) {
    case 'artibot_forward':
      code = `${indent}${t.pseudo_forward} ${block.getFieldValue('MM')}mm\n`;
      break;
    case 'artibot_backward':
      code = `${indent}${t.pseudo_backward} ${block.getFieldValue('MM')}mm\n`;
      break;
    case 'artibot_turn_left':
      code = `${indent}${t.pseudo_turn_left} ${block.getFieldValue('DEG')}°\n`;
      break;
    case 'artibot_turn_right':
      code = `${indent}${t.pseudo_turn_right} ${block.getFieldValue('DEG')}°\n`;
      break;
    case 'artibot_pen_up':
      code = `${indent}${t.pseudo_pen_up}\n`;
      break;
    case 'artibot_pen_down':
      code = `${indent}${t.pseudo_pen_down}\n`;
      break;
    case 'artibot_wait':
      code = `${indent}${t.pseudo_wait} ${block.getFieldValue('SECONDS')}s\n`;
      break;
    case 'artibot_go_home':
      code = `${indent}${t.pseudo_go_home}\n`;
      break;
    case 'artibot_clear':
      code = `${indent}${t.pseudo_clear}\n`;
      break;

    case 'controls_repeat_ext': {
      const timesBlock = block.getInputTargetBlock('TIMES');
      const times = timesBlock ? valueBlockToPseudo(timesBlock) : '?';
      const body = statementBlocksToPseudo(block.getInputTargetBlock('DO'), indent + '  ');
      code = `${indent}${t.pseudo_repeat} ${times} ${t.pseudo_times}:\n${body}`;
      break;
    }

    case 'controls_if': {
      for (let i = 0; block.getInput('IF' + i); i++) {
        const condBlock = block.getInputTargetBlock('IF' + i);
        const cond = condBlock ? valueBlockToPseudo(condBlock) : 'vrai';
        const body = statementBlocksToPseudo(block.getInputTargetBlock('DO' + i), indent + '  ');
        code += `${indent}${i === 0 ? t.pseudo_if : (t.pseudo_else + ' ' + t.pseudo_if)} ${cond}:\n${body}`;
      }
      if (block.getInput('ELSE')) {
        const elseBody = statementBlocksToPseudo(block.getInputTargetBlock('ELSE'), indent + '  ');
        code += `${indent}${t.pseudo_else}:\n${elseBody}`;
      }
      break;
    }

    case 'variables_set': {
      const name = block.getFieldValue('VAR');
      const valBlock = block.getInputTargetBlock('VALUE');
      const val = valBlock ? valueBlockToPseudo(valBlock) : '0';
      code = `${indent}${t.pseudo_set} ${name} ${t.pseudo_to} ${val}\n`;
      break;
    }

    default:
      // Skip unknown blocks (e.g. variable getters, math inside statements)
      break;
  }

  // Chain next block
  const next = block.getNextBlock();
  if (next) code += blockToPseudo(next, indent);
  return code;
}

function statementBlocksToPseudo(firstBlock, indent = '') {
  if (!firstBlock) return '';
  return blockToPseudo(firstBlock, indent);
}

function valueBlockToPseudo(block) {
  if (!block) return '?';
  switch (block.type) {
    case 'math_number':
      return block.getFieldValue('NUM');
    case 'variables_get':
      return block.getFieldValue('VAR');
    case 'math_arithmetic': {
      const opMap = { ADD: '+', MINUS: '-', MULTIPLY: '×', DIVIDE: '÷', POWER: '^' };
      const a = valueBlockToPseudo(block.getInputTargetBlock('A'));
      const b = valueBlockToPseudo(block.getInputTargetBlock('B'));
      return `(${a} ${opMap[block.getFieldValue('OP')] || '?'} ${b})`;
    }
    case 'logic_compare': {
      const opMap = { EQ: '=', NEQ: '≠', LT: '<', LTE: '≤', GT: '>', GTE: '≥' };
      const a = valueBlockToPseudo(block.getInputTargetBlock('A'));
      const b = valueBlockToPseudo(block.getInputTargetBlock('B'));
      return `${a} ${opMap[block.getFieldValue('OP')] || '?'} ${b}`;
    }
    case 'logic_operation': {
      const t = I18N[_pseudoLang];
      const op = block.getFieldValue('OP') === 'AND' ? t.pseudo_and || 'ET' : t.pseudo_or || 'OU';
      const a = valueBlockToPseudo(block.getInputTargetBlock('A'));
      const b = valueBlockToPseudo(block.getInputTargetBlock('B'));
      return `(${a} ${op} ${b})`;
    }
    case 'logic_boolean':
      return block.getFieldValue('BOOL') === 'TRUE' ? 'vrai' : 'faux';
    default:
      return '?';
  }
}

function workspaceToPseudo(workspace) {
  const topBlocks = workspace.getTopBlocks(true);
  if (topBlocks.length === 0) return '';
  return topBlocks.map(b => blockToPseudo(b, '')).join('\n');
}
