/*BHEADER**********************************************************************

  Copyright (c) 1995-2009, Lawrence Livermore National Security,
  LLC. Produced at the Lawrence Livermore National Laboratory. Written
  by the Parflow Team (see the CONTRIBUTORS file)
  <parflow@lists.llnl.gov> CODE-OCEC-08-103. All rights reserved.

  This file is part of Parflow. For details, see
  http://www.llnl.gov/casc/parflow

  Please read the COPYRIGHT file or Our Notice and the LICENSE file
  for the GNU Lesser General Public License.

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License (as published
  by the Free Software Foundation) version 2.1 dated February 1999.

  This program is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the IMPLIED WARRANTY OF
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the terms
  and conditions of the GNU General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with this program; if not, write to the Free Software
  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
  USA
**********************************************************************EHEADER*/

/******************************************************************************
 *
 * Routines for initializing the problem.
 *
 *-----------------------------------------------------------------------------
 *
 *****************************************************************************/

#include "parflow.h"
#include "problem.h"


/*--------------------------------------------------------------------------
 * NewProblem
 *--------------------------------------------------------------------------*/
  
Problem   *NewProblem(solver)

int	   solver;   /* Designates the solver from which this routine is 
			called.  Values defined in problem.h. */

{
   Problem      *problem;

   int           version_number;
   int           num_phases;
   int           num_contaminants;

   char *phases;
   char *contaminants;

   int i;
   
   char key[IDB_MAX_KEY_LEN];
   
   problem = ctalloc(Problem, 1);

   /*-----------------------------------------------------------------------
    * Check the file version number
    *-----------------------------------------------------------------------*/

   version_number = GetInt("FileVersion");

   if (version_number != PFIN_VERSION)
   {
      amps_Printf("Error: need input file version %d\n", PFIN_VERSION);
      exit(1);
   }

   /*-----------------------------------------------------------------------
    * ProblemGeometries
    *-----------------------------------------------------------------------*/

   ProblemGeometries(problem) =
      PFModuleNewModule(Geometries, ());

   /*-----------------------------------------------------------------------
    * Setup timing information
    *-----------------------------------------------------------------------*/

   ProblemBaseTimeUnit(problem) = GetDouble("TimingInfo.BaseUnit");
   ProblemStartCount(problem)   = GetInt("TimingInfo.StartCount");
   ProblemStartTime(problem)    = GetDouble("TimingInfo.StartTime");
   ProblemStopTime(problem)     = GetDouble("TimingInfo.StopTime");
   ProblemDumpInterval(problem) = GetDouble("TimingInfo.DumpInterval");

   NameArray      switch_na = NA_NewNameArray("False True");
   char *switch_name = GetStringDefault("TimingInfo.DumpAtEnd", "False");
   int switch_value = NA_NameToIndex(switch_na, switch_name);
   if(switch_value < 0)
   {
      InputError("Error: invalid print switch value <%s> for key <%s>\n",
      switch_name, key);
   }
   ProblemDumpAtEnd(problem) = switch_value;
   NA_FreeNameArray(switch_na);

   /*-----------------------------------------------------------------------
    * Read in the cycle data
    *-----------------------------------------------------------------------*/
   ReadGlobalTimeCycleData();
   
   if ( solver == RichardsSolve )
   {
      ProblemSelectTimeStep(problem) = 
         PFModuleNewModule(SelectTimeStep, ());
   }

   /*-----------------------------------------------------------------------
    * ProblemDomain
    *-----------------------------------------------------------------------*/

   ProblemDomain(problem) =
      PFModuleNewModule(Domain, ());

   /*-----------------------------------------------------------------------
    * Setup ProblemNumPhases and ProblemNumContaminants
    *-----------------------------------------------------------------------*/

   phases = GetString("Phase.Names");
   GlobalsPhaseNames = NA_NewNameArray(phases);
   num_phases = ProblemNumPhases(problem) = NA_Sizeof(GlobalsPhaseNames);

   contaminants = GetString("Contaminants.Names");
   GlobalsContaminatNames = NA_NewNameArray(contaminants);
   num_contaminants = ProblemNumContaminants(problem) = 
      NA_Sizeof(GlobalsContaminatNames);

   /*-----------------------------------------------------------------------
    * PDE coefficients
    *-----------------------------------------------------------------------*/

   ProblemGravity(problem) = GetDouble("Gravity");

   ProblemPhaseDensity(problem) = 
      PFModuleNewModule(PhaseDensity, (num_phases));

   problem -> phase_viscosity = ctalloc(double, num_phases);
   for(i = 0; i < num_phases; i++)
   {
      /* SGS need to add switch on type */
      sprintf(key, "Phase.%s.Viscosity.Value", 
	      NA_IndexToName(GlobalsPhaseNames, i));
      problem -> phase_viscosity[i] = GetDouble(key);
   }

   (problem -> contaminant_degradation) = ctalloc(double, num_contaminants);


   for(i = 0; i < num_contaminants; i++)
   {
      /* SGS need to add switch on type */
      sprintf(key, "Contaminants.%s.Degradation.Value",
	      NA_IndexToName(GlobalsContaminatNames, i));
      problem -> contaminant_degradation[i] = GetDouble(key);
   }


   ProblemPermeability(problem) =
      PFModuleNewModule(Permeability, ());

   ProblemPorosity(problem) =
      PFModuleNewModule(Porosity, ());

   ProblemRetardation(problem) =
      PFModuleNewModule(Retardation, (num_contaminants));

   if ( solver != RichardsSolve )
   {
      ProblemPhaseMobility(problem) =
         PFModuleNewModule(PhaseMobility, (num_phases));
   }
   else /* Richards case */
   {  
      ProblemPhaseRelPerm(problem) = PFModuleNewModule(PhaseRelPerm, ());
   }

   ProblemPhaseSource(problem) =
      PFModuleNewModule(PhaseSource, ());

   ProblemSpecStorage(problem) =
      PFModuleNewModule(SpecStorage, ()); //sk

   ProblemXSlope(problem) =
      PFModuleNewModule(XSlope, ()); //sk

   ProblemYSlope(problem) =
      PFModuleNewModule(YSlope, ()); //sk

   ProblemMannings(problem) =
      PFModuleNewModule(Mannings, ()); //sk

   if ( solver != RichardsSolve )
   {
   ProblemCapillaryPressure(problem) =
      PFModuleNewModule(CapillaryPressure, (num_phases));
   }
   else /* Richards case */
   {  
      ProblemSaturation(problem) = 
        PFModuleNewModule(Saturation, ());
   }

   /*-----------------------------------------------------------------------
    * Boundary conditions
    *-----------------------------------------------------------------------*/

   if ( solver != RichardsSolve )
   {
      ProblemBCInternal(problem) = PFModuleNewModule(BCInternal, ());
   }
   else
   {
      ProblemBCInternal(problem) = 
	 PFModuleNewModule(RichardsBCInternal, ());
   }

   ProblemBCPressure(problem) =
      PFModuleNewModule(BCPressure, (num_phases));

   ProblemBCPressurePackage(problem) =
      PFModuleNewModule(BCPressurePackage, (num_phases));


   if ( solver != RichardsSolve )
   {
      ProblemBCPhaseSaturation(problem) =
         PFModuleNewModule(BCPhaseSaturation, (num_phases));
   }

   /*-----------------------------------------------------------------------
    * Initial conditions
    *-----------------------------------------------------------------------*/

   if ( solver != RichardsSolve )
   {
      
	   ProblemICPhaseSatur(problem) =
         PFModuleNewModule(ICPhaseSatur, (num_phases));
   }
   else
   {
      ProblemICPhasePressure(problem) = 
         PFModuleNewModule(ICPhasePressure, ());
   }

   ProblemICPhaseConcen(problem) =
      PFModuleNewModule(ICPhaseConcen, (num_phases, num_contaminants));

   /*-----------------------------------------------------------------------
    * If know exact solution for Richards' case, get data for which 
    * predefined problem is being run
    *-----------------------------------------------------------------------*/

   if ( solver == RichardsSolve )
   {
      ProblemL2ErrorNorm(problem) = 
	 PFModuleNewModule(L2ErrorNorm, ());
   }

   /*-----------------------------------------------------------------------
    * Constitutive relations
    *-----------------------------------------------------------------------*/

   if ( solver != RichardsSolve )
   {
      ProblemSaturationConstitutive(problem) =
         PFModuleNewModule(SaturationConstitutive, (num_phases));
   }

   /*----------------------------------------------------------------------
    * Package setups
    *-----------------------------------------------------------------------*/

   ProblemWellPackage(problem) =
      PFModuleNewModule(WellPackage, (num_phases, num_contaminants));
 
   return problem;
}


/*--------------------------------------------------------------------------
 * FreeProblem
 *--------------------------------------------------------------------------*/

void      FreeProblem(problem, solver)
Problem  *problem;
int       solver;
{
   PFModuleFreeModule(ProblemWellPackage(problem));


   NA_FreeNameArray(GlobalsPhaseNames);
   NA_FreeNameArray(GlobalsContaminatNames);

   if ( solver != RichardsSolve )
   {
      PFModuleFreeModule(ProblemSaturationConstitutive(problem));
      PFModuleFreeModule(ProblemICPhaseSatur(problem));
      PFModuleFreeModule(ProblemBCPhaseSaturation(problem));
      PFModuleFreeModule(ProblemCapillaryPressure(problem));
      PFModuleFreeModule(ProblemPhaseMobility(problem));
   }
   else
   {
      PFModuleFreeModule(ProblemSaturation(problem));
      PFModuleFreeModule(ProblemICPhasePressure(problem));
      PFModuleFreeModule(ProblemPhaseRelPerm(problem));
      PFModuleFreeModule(ProblemSelectTimeStep(problem));
      PFModuleFreeModule(ProblemL2ErrorNorm(problem));
   }
   PFModuleFreeModule(ProblemICPhaseConcen(problem));
   PFModuleFreeModule(ProblemBCPressurePackage(problem));
   PFModuleFreeModule(ProblemBCPressure(problem));
   PFModuleFreeModule(ProblemBCInternal(problem));

   PFModuleFreeModule(ProblemPhaseSource(problem));
   PFModuleFreeModule(ProblemRetardation(problem));
   PFModuleFreeModule(ProblemPorosity(problem));
   PFModuleFreeModule(ProblemPermeability(problem));
   tfree(problem -> contaminant_degradation);
   PFModuleFreeModule(ProblemPhaseDensity(problem));
   tfree(problem -> phase_viscosity);
   PFModuleFreeModule(ProblemSpecStorage(problem)); //sk
   PFModuleFreeModule(ProblemXSlope(problem)); //sk
   PFModuleFreeModule(ProblemYSlope(problem));
   PFModuleFreeModule(ProblemMannings(problem));

   PFModuleFreeModule(ProblemDomain(problem));

   PFModuleFreeModule(ProblemGeometries(problem));

   FreeGlobalTimeCycleData();

   tfree(problem);
}


/*--------------------------------------------------------------------------
 * NewProblemData
 *--------------------------------------------------------------------------*/
  
ProblemData   *NewProblemData(grid,grid2d)
Grid          *grid;
Grid          *grid2d;
{
   ProblemData  *problem_data;

   problem_data = ctalloc(ProblemData, 1);

   ProblemDataPermeabilityX(problem_data) = NewVector(grid, 1, 1);
   ProblemDataPermeabilityY(problem_data) = NewVector(grid, 1, 1);
   ProblemDataPermeabilityZ(problem_data) = NewVector(grid, 1, 1);

   ProblemDataSpecificStorage(problem_data) = NewVector(grid, 1, 1); //sk
   ProblemDataTSlopeX(problem_data) = NewVector(grid2d, 1, 1); //sk
   ProblemDataTSlopeY(problem_data) = NewVector(grid2d, 1, 1); //sk
   ProblemDataMannings(problem_data) = NewVector(grid2d, 1, 1); //sk

   ProblemDataPorosity(problem_data) = NewVector(grid, 1, 1);

   ProblemDataBCPressureData(problem_data) = NewBCPressureData();

   ProblemDataWellData(problem_data) = NewWellData();

   return problem_data;
}


/*--------------------------------------------------------------------------
 * FreeProblemData
 *--------------------------------------------------------------------------*/

void          FreeProblemData(problem_data)  
ProblemData  *problem_data;
{
   int  i;


   if (problem_data)
   {

#if 1
      /* SGS This is freed in problem_geometries.c where it is 
	 created */
      for (i = 0; i < ProblemDataNumSolids(problem_data); i++)
         GrGeomFreeSolid(ProblemDataGrSolids(problem_data)[i]);
      tfree(ProblemDataGrSolids(problem_data));
#endif

      FreeWellData(ProblemDataWellData(problem_data));
      FreeBCPressureData(ProblemDataBCPressureData(problem_data));
      FreeVector(ProblemDataPorosity(problem_data));
      FreeVector(ProblemDataPermeabilityX(problem_data));
      FreeVector(ProblemDataPermeabilityY(problem_data));
      FreeVector(ProblemDataPermeabilityZ(problem_data));
      FreeVector(ProblemDataSpecificStorage(problem_data)); //sk
      FreeVector(ProblemDataTSlopeX(problem_data)); //sk
      FreeVector(ProblemDataTSlopeY(problem_data)); //sk
      FreeVector(ProblemDataMannings(problem_data)); //sk

      tfree(problem_data);
   }
}