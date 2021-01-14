import { Case, CodeGenerator, Default, Edge, GWModule, HIGH, If, LOW, Signal, Switch } from "gateware-ts";


enum PanelState {
  Start,
  ShiftingPixel,
  ShiftingPixelOff,
  DisplayRow,
  AddressIncrement
};
const STATE_BITS = 3;

class LEDPanelDemo extends GWModule {
  CLK = this.input(Signal());

  R0 = this.output(Signal());
  R1 = this.output(Signal());
  G0 = this.output(Signal());
  G1 = this.output(Signal());
  B0 = this.output(Signal());
  B1 = this.output(Signal());

  A0 = this.output(Signal());
  A1 = this.output(Signal());
  A2 = this.output(Signal());
  A3 = this.output(Signal());
  A4 = this.output(Signal());

  LA = this.output(Signal());
  BL = this.output(Signal());
  CL = this.output(Signal());

  xPos = this.internal(Signal(6));
  address = this.internal(Signal(5));
  state = this.internal(Signal(STATE_BITS));

  serpinsky = this.internal(Signal());

  describe() {
    this.combinationalLogic([
      this.A0 ['='] (this.address.bit(0)),
      this.A1 ['='] (this.address.bit(1)),
      this.A2 ['='] (this.address.bit(2)),
      this.A3 ['='] (this.address.bit(3)),
      this.A4 ['='] (this.address.bit(4)),

      this.serpinsky ['='] (this.xPos.slice(4, 0) ['&'] (this.address) ['=='] (0))
    ]);

    this.syncBlock(this.CLK, Edge.Positive, [

      Switch (this.state, [

        Case (PanelState.Start, [
          this.R0 ['='] (0),
          this.R1 ['='] (0),
          this.G0 ['='] (0),
          this.G1 ['='] (0),
          this.B0 ['='] (0),
          this.B1 ['='] (0),

          this.CL ['='] (LOW),
          this.LA ['='] (LOW),
          this.BL ['='] (LOW),

          this.address ['='] (0),
          this.xPos ['='] (0),

          this.state ['='] (PanelState.ShiftingPixel)
        ]),

        Case (PanelState.ShiftingPixel, [
          this.R0 ['='] (this.serpinsky),
          this.G0 ['='] (this.serpinsky),
          this.B0 ['='] (this.serpinsky),
          this.R1 ['='] (this.serpinsky),
          this.G1 ['='] (this.serpinsky),
          this.B1 ['='] (this.serpinsky),

          this.BL ['='] (LOW),

          this.CL ['='] (HIGH),
          this.state ['='] (PanelState.ShiftingPixelOff)
        ]),

        Case (PanelState.ShiftingPixelOff, [
          this.CL ['='] (LOW),

          If (this.xPos ['=='] (63), [
            this.state ['='] (PanelState.DisplayRow)
          ]) .Else ([
            this.state ['='] (PanelState.ShiftingPixel)
          ]),

          this.xPos ['='] (this.xPos ['+'] (1)),
        ]),

        Case (PanelState.DisplayRow, [
          this.LA ['='] (HIGH),
          this.state ['='] (PanelState.AddressIncrement)
        ]),

        Case (PanelState.AddressIncrement, [
          this.LA ['='] (LOW),
          this.BL ['='] (HIGH),

          this.address ['='] (this.address ['+'] (1)),
          this.state ['='] (PanelState.ShiftingPixel)
        ]),

        Default ([
          this.state ['='] (PanelState.Start)
        ])
      ])

    ]);
  }
}

const cg = new CodeGenerator(new LEDPanelDemo('top'), {
  pcfPath: './icebreaker.pcf'
});
cg.buildBitstream('led-panel');
